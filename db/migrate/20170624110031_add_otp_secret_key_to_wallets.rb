class AddOtpSecretKeyToWallets < ActiveRecord::Migration[5.1]
  def change
    add_column :wallets, :otp_secret_key, :string
  end
end
