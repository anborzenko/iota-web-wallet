require 'json'


class AdminController < ApplicationController
  def get_data
    @admin = Admin.find_by_pk(params[:pk])
    unless @admin.nil?
      begin
        render json: get_stats.to_json
      rescue StandardError => error
        render json: { error: error.message }
      end
    end
  end

  def login
  end

  private

  def get_stats
    everything = {}

    everything[:num_wallets] = Wallet.count
    everything[:num_admins] = Admin.count
    everything[:num_wallets_created_last_day] = Wallet.where(created_at: 24.hours.ago..Time.now).count
    everything
  end
end
