class WalletsController < ApplicationController
  def login
    if params.key?(:username)
      wallet = Wallet.find_by_username(params[:username])
      if wallet.nil?
        return render json: { success: false, message: 'Username not found' }
      end

      if wallet.has2fa
        if params[:otp_key] && wallet.authenticate_otp(params[:otp_key])
          render json: { success: true, encrypted_seed: wallet[:encrypted_seed] }
        else
          render json: { success: false, require_2fa: true }
        end
      else
        render json: { success: true, encrypted_seed: wallet[:encrypted_seed] }
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
        qr = RQRCode::QRCode.new(@wallet.provisioning_uri(@wallet.username, issuer: 'IOTAWallet'),size: 10, level: :h)
        render json: { success: true, qr: qr.as_svg(offset: 0, color: '000', shape_rendering: 'crispEdges', module_size: 5)}
      else
        render json: { success: true }
      end
    else
      render json: { success: false, message: @wallet.errors.full_messages.to_sentence }
    end
  end

  def validate2fa
    if params[:otp_key]
      if params[:username]
        wallet = Wallet.find_by_username(params[:username])
        success = wallet.authenticate_otp(params[:otp_key])
        render json: { success: success, message: success ? '' : 'Invalid key. Try again' }
      else
        render json: { success: false, message: 'Something went wrong: Username not supplied' }
      end
    else
      render json: { success: false, message: 'No key provided' }
    end
  end

  def exists
    wallet = Wallet.find_by_username(params[:username])
    render json: { exists: !wallet.nil? }
  end

  def get_next_pending_transaction
    max_allowed_replays = 3

    oldest = PendingTransaction.order(:last_replay).first
    while oldest.num_replays > max_allowed_replays
      oldest.destroy
      oldest = PendingTransaction.order(:last_replay).first
    end

    min_wait_time = 10 # The minimum number of minutes between each replay
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

  private

  def create_wallet(wallet_params)
    @wallet = Wallet.create(username: wallet_params[:username],
                            encrypted_seed: wallet_params[:encrypted_seed],
                            has2fa: wallet_params[:has2fa])
    !@wallet.errors.any?
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def wallet_params
    params.require(:wallets).permit(:username, :encrypted_seed)
  end
end
