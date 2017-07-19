require 'json'


class AdminController < ApplicationController
  def get_data
    @admin = Admin.find_by_pk(params[:pk])
    unless @admin.nil?
      begin
        render json: get_everything.to_json
      rescue StandardError => error
        render json: { error: error.message }
      end
    end
  end

  def login
  end

  private

  def get_everything
    current_time = DateTime.current.to_i
    pending = PendingTransaction.all

    everything = {}
    everything[:num_pending] = pending.count

    if everything[:num_pending] > 0
      everything[:pending_avg_time] = pending.map { |x| (current_time - x.last_replay.to_i) / 60.0 }.compact.inject(0, :+) / everything[:num_pending]
    end
    everything[:num_wallets] = Wallet.count
    everything[:num_admins] = Admin.count
    everything[:num_users_without_password_hash] = User.where(password_hash: nil).count
    everything[:num_wallets_created_last_day] = Wallet.where(created_at: 24.hours.ago..Time.now).count
    everything
  end
end
