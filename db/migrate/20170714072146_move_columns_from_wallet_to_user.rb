class MoveColumnsFromWalletToUser < ActiveRecord::Migration[5.1]
  def change
    Wallet.find_each do |wallet|
      User.create!(username: wallet.username, otp_secret_key: wallet.otp_secret_key,
                   has2fa: wallet.has2fa, has_confirmed_2fa: wallet.has_confirmed_2fa,
                   password_hash: wallet.password_hash, wallet: wallet)
    end
  end
end
