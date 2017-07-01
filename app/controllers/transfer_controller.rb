class TransferController < ApplicationController
  def transfer
    unless params.key?(:user)
      return redirect_to root_path
    end

    username = params[:user]
    wallet = Wallet.find_by_username(username)

    if username.nil?
      return redirect_to root_path
    end

    @addresses = wallet.receive_addresses
  end
end
