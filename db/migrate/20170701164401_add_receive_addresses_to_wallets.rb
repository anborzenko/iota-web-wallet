class AddReceiveAddressesToWallets < ActiveRecord::Migration[5.1]
  def change
    add_column :wallets, :receive_addresses, :text
  end
end
