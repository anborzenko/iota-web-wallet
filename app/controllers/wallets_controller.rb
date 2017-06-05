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
    if !wallet.nil?
      render json: { success: false, message: 'Username is taken' }
      return
    end

    if create_wallet(params)
      render json: { success: true }
    else
      render json: { success: false, message: @wallet.errors.full_messages.to_sentence }
    end
  end

  private

  def create_wallet(wallet_params)
    @wallet = Wallet.create(username: wallet_params[:username], encrypted_seed: wallet_params[:encrypted_seed])
    !@wallet.errors.any?
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def wallet_params
    params.require(:wallets).permit(:username, :encrypted_seed)
  end
end
