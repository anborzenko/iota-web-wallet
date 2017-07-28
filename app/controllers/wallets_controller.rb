class WalletsController < ApplicationController
  before_action :authenticate_session, only: [:add_addresses]

  def add_addresses
    addresses = params[:addresses]
    return unless addresses

    wallet = current_user.wallet

    # Make sure we only have n addresses
    n = 10
    addresses = addresses.split(',')[0..n].join(',')

    wallet.receive_addresses = addresses
    wallet.save
  end

  def receive_addresses
    render json: { addresses: User.find_by_username(params[:username]).wallet.receive_addresses }
  end

  private

  def authenticate_session
    unless logged_in?
      render json: { success: false, message: 'Invalid session' }
    end
  end
end
