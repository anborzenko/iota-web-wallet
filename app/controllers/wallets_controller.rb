class WalletsController < ApplicationController
  before_action :set_wallet, only: [:show, :edit, :update, :transmit, :receive]

  def transmit

  end

  def login
    if params.key?(:username)
      wallet = Wallet.find_by_username(params[:username])
      if wallet.nil?
        render json: { success: false, message: 'Invalid username' }
      else
        render json: { success: true, encrypted_seed: wallet[:encrypted_seed] }
      end
    else
      @wallet = Wallet.new
    end
  end

  def signup
    if create_wallet(params)
      render json: { success: true }
    else
      render json: { success: false, message: @wallet.errors.full_messages.to_sentence }
    end
  end

  # GET /wallets/1
  # GET /wallets/1.json
  def show
  end

  # GET /wallets/1/edit
  def edit
  end

  # PATCH/PUT /wallets/1
  # PATCH/PUT /wallets/1.json
  def update
    respond_to do |format|
      if @wallet.update(wallet_params)
        format.html { redirect_to @wallet, notice: 'Wallet was successfully updated.' }
        format.json { render :show, status: :ok, location: @wallet }
      else
        format.html { render :edit }
        format.json { render json: @wallet.errors, status: :unprocessable_entity }
      end
    end
  end

  private

  def create_wallet(wallet_params)
    @wallet = Wallet.create(username: wallet_params[:username], encrypted_seed: wallet_params[:encrypted_seed])
    !@wallet.errors.any?
  end

  # Use callbacks to share common setup or constraints between actions.
  def set_wallet
    redirect_to wallets_login_path unless (cookies.key?(:encrypted_seed) || cookies.key?(:seed))
  end

  # Never trust parameters from the scary internet, only allow the white list through.
  def wallet_params
    params.require(:wallets).permit(:username, :seed, :encrypted_seed, :password)
  end
end
