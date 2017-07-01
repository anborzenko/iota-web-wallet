class AddHasConfirmed2faToWallets < ActiveRecord::Migration[5.1]
  def change
    add_column :wallets, :has_confirmed_2fa, :boolean
  end
end
