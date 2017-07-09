class AddPasswordHashToWallet < ActiveRecord::Migration[5.1]
  def change
    add_column :wallets, :password_hash, :string
  end
end
