require 'execjs'
require 'json'

class WalletsController < ApplicationController
  def login
    if params.key?(:username)
      @wallet = Wallet.find_by_username(params[:username])
      if @wallet.nil?
        return render json: { success: false, message: 'Username not found' }
      end

      return unless authenticate_wallet

      if @wallet.has2fa
        unless @wallet.has_confirmed_2fa
          return render json: { success: false, require_2fa_confirmation: true,
                                qr: get_qr.as_svg(offset: 0, color: '000', shape_rendering: 'crispEdges', module_size: 5) }
        end
        if params[:otp_key] && @wallet.authenticate_otp(params[:otp_key])
          render json: { success: true, encrypted_seed: @wallet[:encrypted_seed] }
        else
          render json: { success: false, require_2fa: true }
        end
      else
        render json: { success: true, encrypted_seed: @wallet[:encrypted_seed] }
      end
    else
      @wallet = Wallet.new
    end
  end

  def signup
    wallet = Wallet.find_by_username(params[:username])
    unless wallet.nil?
      render json: { success: false, message: 'Username is taken' }
      return
    end

    params[:has2fa] = params[:has2fa] == 'true'

    if create_wallet(params)
      if @wallet.has2fa
        render json: { success: true, qr: get_qr.as_svg(offset: 0, color: '000', shape_rendering: 'crispEdges', module_size: 5)}
      else
        render json: { success: true }
      end
    else
      render json: { success: false, message: @wallet.errors.full_messages.to_sentence }
    end
  end

  def confirm2fa
    unless params[:username]
      return render json: { success: false, message: 'Something went wrong: Username not supplied' }
    end

    @wallet = Wallet.find_by_username(params[:username])
    if params[:otp_key]
      success = @wallet.authenticate_otp(params[:otp_key])
      if success
        @wallet.has_confirmed_2fa = true
        @wallet.save
        render json: { success: true, encrypted_seed: @wallet[:encrypted_seed] }
      else
        render json: { success: false, message: 'Invalid key. Try again' }
      end
    else
      render json: { success: false, message: 'OTP key not supplied' }
    end
  end

  def exists
    wallet = Wallet.find_by_username(params[:username])
    render json: { exists: !wallet.nil? }
  end

  def get_next_pending_transaction
    max_allowed_replays = 10

    oldest = PendingTransaction.order(:last_replay).first
    while oldest.num_replays > max_allowed_replays
      oldest.destroy
      oldest = PendingTransaction.order(:last_replay).first
    end

    min_wait_time = 5 # The minimum number of minutes between each replay
    if (DateTime.current.to_i - oldest.last_replay.to_i) / 60.0 < min_wait_time
      raise 'It\'s too soon'
    end

    oldest.last_replay = DateTime.current
    oldest.num_replays += 1
    oldest.save
    render json: { tail_hash: oldest.tail_hash }
  end

  def delete_pending_transaction
    tail_hash = params[:tail_hash]
    PendingTransaction.find_by_tail_hash(tail_hash).destroy
  end

  def add_pending_transaction
    return if params[:tail_hash].nil?

    PendingTransaction.create(tail_hash: params[:tail_hash], last_replay: DateTime.current, num_replays: 0)
  end

  def add_addresses
    addresses = params[:addresses]
    username = params[:username]

    @wallet = Wallet.find_by_username(username)
    return unless authenticate_wallet

    # Make sure we only have n addresses
    n = 10
    addresses = addresses.split(',')[0..n].join(',')

    @wallet.receive_addresses = addresses
    @wallet.save
  end

  def receive_addresses
    render json: { addresses: Wallet.find_by_username(params[:username]).receive_addresses }
  end

  private

  def create_wallet(wallet_params)
    @wallet = Wallet.create(username: wallet_params[:username],
                            encrypted_seed: wallet_params[:encrypted_seed],
                            has2fa: wallet_params[:has2fa],
                            password_hash: params[:password_hash])
    @wallet.errors.none?
  end

  def get_qr
    RQRCode::QRCode.new(@wallet.provisioning_uri(@wallet.username, issuer: 'IOTAWallet'),size: 10, level: :h)
  end

  def authenticate_wallet
=begin
    This method contains a lot of legacy patching. The server did not store
    the hashed password from the beginning, so if we don't have it, be need
    to request the real password from the user and use it to decrypt the seed.
    This has to be done server side to ensure that the identity is real. The
    seed or the password is of course never stored during this process,
    and is discarded immediately after the identity has been proved.
    Users that do have provided the password hash never need to provide the
    password again, it's only a one time job to ensure that we know the
    identity of the user
=end

    unless params.key?('password_hash')
      render json: { success: false, message: 'Failed to provide password hash' }
      return false
    end

    if @wallet.password_hash.nil? && !params.key?('password')
      render json: { success: false, require_first_time_proof: true }
      return false
    end

    if !@wallet.password_hash.nil? && @wallet.password_hash == params[:password_hash]
      true
    elsif @wallet.password_hash.nil? && is_valid_password?(params[:password], @wallet.encrypted_seed)
      # Save the hashed password for later so we don't need to do this again
      @wallet.password_hash = params[:password_hash]
      @wallet.save
      true
    else
      render json: { success: false, message: 'Wrong password' }
      false
    end
  end

  def is_valid_password?(pass, enc_seed)
=begin
    First of all: I'm really sorry about this code. There is really no excuse
    for doing this, but let me try to explain:
    The idea is simple. Validate the user identity by testing if the password
    is able to decrypt the seed or not. This really backfired when I tried
    to decrypt a sjcl ciphertext in ruby. Apparently no ruby library known
    to man are able to handle the ciphertexts from sjcl, even if they say they
    are.

    So I give you the ugliest hack imaginable: Inject the sjcl lib into ruby
    and execute it using ExecJS. Enjoy
=end

    source = File.open(File.join(File.dirname(__FILE__), '../assets/javascripts/vendor/sjcl.js')).read
    context = ExecJS.compile(source)

    begin
      !context.call("sjcl.decrypt", pass, enc_seed, bare: true).nil?
    rescue
      false
    end
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def wallet_params
    params.require(:wallets).permit(:username, :encrypted_seed, :password, :password_hash)
  end
end
