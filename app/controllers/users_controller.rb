class UsersController < ApplicationController
  def login
    if params.key?(:username)
      @user = User.find_by_username(params[:username])
      if @user.nil?
        return render json: { success: false, message: 'Username not found' }
      end

      return unless authenticate_user

      if @user.has2fa
        unless @user.has_confirmed_2fa
          return render json: { success: false, require_2fa_confirmation: true,
                                qr: get_qr.as_svg(offset: 0, color: '000', shape_rendering: 'crispEdges', module_size: 5) }
        end
        if params[:otp_key] && @user.authenticate_otp(params[:otp_key])
          render json: { success: true, encrypted_seed: @user.wallet[:encrypted_seed] }
        else
          render json: { success: false, require_2fa: true }
        end
      else
        render json: { success: true, encrypted_seed: @user.wallet[:encrypted_seed] }
      end
    else
      @user = User.new
    end
  end

  def signup
    user = User.find_by_username(params[:username])
    unless user.nil?
      render json: { success: false, message: 'Username is taken' }
      return
    end

    params[:has2fa] = params[:has2fa] == 'true'

    if create_user(params)
      if @user.has2fa
        render json: { success: true,
                       qr: get_qr.as_svg(offset: 0, color: '000', shape_rendering: 'crispEdges', module_size: 5)}
      else
        render json: { success: true }
      end
    else
      render json: { success: false, message: @user.errors.full_messages.to_sentence }
    end
  end

  def confirm2fa
    unless params[:username]
      return render json: { success: false, message: 'Something went wrong: Username not supplied' }
    end

    unless params[:otp_key]
      return render json: { success: false, message: 'Something went wrong: OTP key not supplied' }
    end

    @user = User.find_by_username(params[:username])

    if @user.authenticate_otp(params[:otp_key])
      @user.has_confirmed_2fa = true

      render json: { success: @user.save,
                     encrypted_seed: @user.wallet[:encrypted_seed],
                     message: @user.errors.full_messages.to_sentence }
    else
      render json: { success: false, message: 'Invalid key. Try again' }
    end
  end

  def exists
    user = User.find_by_username(params[:username])
    render json: { exists: !user.nil? }
  end

  def show
    @user = User.find_by_username(cookies[:username])
  end

  def update
  end

  private

  def create_user(user_params)
    @user = User.new(username: user_params[:username],
                            has2fa: user_params[:has2fa],
                            password_hash: user_params[:password_hash])
    @user.build_wallet(encrypted_seed: user_params[:encrypted_seed]) if @user.errors.none?

    if @user.errors.none? && @user.wallet.errors.none?
      @user.wallet.save && @user.save
    else
      false
    end
  end

  def get_qr
    RQRCode::QRCode.new(@user.provisioning_uri(@user.username, issuer: 'IOTAWallet'),size: 10, level: :h)
  end

  def authenticate_user
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

    if @user.password_hash.nil? && !params.key?('password')
      render json: { success: false, require_first_time_proof: true }
      return false
    end

    if !@user.password_hash.nil? && @user.password_hash == params[:password_hash]
      true
    elsif @user.password_hash.nil? && is_valid_password?(params[:password], @user.wallet.encrypted_seed)
      # Save the hashed password for later so we don't need to do this again
      @user.password_hash = params[:password_hash]
      @user.save
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
end
