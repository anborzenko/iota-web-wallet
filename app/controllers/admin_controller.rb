require 'json'


class AdminController < ApplicationController
  def get_data
    @admin = Admin.find_by_pk(params[:pk])
    unless @admin.nil?
      begin
        render json: get_everything.to_json
      rescue StandardError => error
        render json: { error: error }
      end
    end
  end

  def login
    unless Admin.any?
      ## No existing admins. Create the first and only automatically generated admin
      @admin = Admin.create(pk: params[:pk], level: 0)
    end
  end

  private

  def get_everything
    current_time = DateTime.current.to_i
    pending = PendingTransaction.all

    everything = {}
    everything[:num_pending] = pending.count

    everything[:pending_avg_time] = pending.map { |x| (current_time - x.last_replay.to_i) / 60.0 }.compact.inject(0, :+) / everything[:num_pending]
    everything[:num_wallets] = Wallet.count
    everything[:num_admins] = Admin.count
    everything[:num_wallets_created_last_day] = Wallet.where(created_at: 24.hours.ago..Time.now).count
    everything
  end
end
