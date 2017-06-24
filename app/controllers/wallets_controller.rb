class WalletsController < ApplicationController
  def login
    if params.key?(:username)
      wallet = Wallet.find_by_username(params[:username])
      if wallet.nil?
        render json: { success: false, message: 'Username not found' }
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

    if create_wallet(params)
      render json: { success: true }
    else
      render json: { success: false, message: @wallet.errors.full_messages.to_sentence }
    end
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
                            encrypted_seed: wallet_params[:encrypted_seed])
    !@wallet.errors.any?
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def wallet_params
    params.require(:wallets).permit(:username, :encrypted_seed)
  end
end
