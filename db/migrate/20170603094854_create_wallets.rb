class CreateWallets < ActiveRecord::Migration[5.1]
  def change
    create_table :wallets do |t|
      t.string :encrypted_seed
      t.text :receive_addresses

      t.timestamps
    end
  end
end
