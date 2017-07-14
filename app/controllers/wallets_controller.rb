require 'execjs'
require 'json'

class WalletsController < ApplicationController
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
    return unless authenticate_user

    # Make sure we only have n addresses
    n = 10
    addresses = addresses.split(',')[0..n].join(',')

    @wallet.receive_addresses = addresses
    @wallet.save
  end

  def receive_addresses
    render json: { addresses: Wallet.find_by_username(params[:username]).receive_addresses }
  end
end
