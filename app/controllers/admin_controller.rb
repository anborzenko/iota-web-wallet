require 'openssl'
require 'base64'
require 'json'


class AdminController < ApplicationController
  def get_data
    @admin = Admin.find_by_pk(params[:pk])
    unless @admin.nil?
      begin
        render json: encrypt(get_content)
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

  def encrypt(data)
    alg = "AES-128-CCM"
    key = OpenSSL::Cipher::Cipher.new(alg).random_key
    iv = OpenSSL::Cipher::Cipher.new(alg).random_iv
    aes = OpenSSL::Cipher::Cipher.new(alg)
    aes.encrypt
    aes.key = key
    aes.iv = iv
    cipher = aes.update(data)
    cipher << aes.final

    # TODO: Construct a key such that it maches the sjcl syntax. Encrypt it using rsa

    public_key = OpenSSL::PKey::RSA.new(@admin[:pk])
    key = Base64.encode64(public_key.public_encrypt(key))

    { cipher: cipher, encrypted_key: key }
  end

  def get_content
    level = @admin.level
    if level == 0
      get_everything.to_json
    else
      # TODO: Translator access or something.
    end
  end

  def get_everything
    current_time = DateTime.current.to_i
    pending = PendingTransaction.all

    everything = {}
    everything[:num_pending] = pending.count

    everything[:pending_avg_time] = pending.map { |x| (current_time - x.last_replay.to_i) / 60.0 }.compact.inject(0, :+) / everything[:num_pending]
    everything[:recent_log] = get_logs(500)
    everything[:num_wallets] = Wallet.count
    everything[:num_wallets_created_last_day] = Wallet.where(created_at: 24.hours.ago..Time.now).count
    everything
  end

  def get_logs(lines)
    if Rails.env == "production"
      "tail -n #{lines} log/production.log"
    else
      "tail -n #{lines} log/development.log"
    end
  end
end
