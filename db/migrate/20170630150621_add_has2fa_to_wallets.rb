class AddHas2faToWallets < ActiveRecord::Migration[5.1]
  def change
    add_column :wallets, :has2fa, :boolean
  end
end
