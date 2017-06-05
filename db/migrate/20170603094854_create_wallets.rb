class CreateWallets < ActiveRecord::Migration[5.1]
  def change
    create_table :wallets do |t|
      t.string :username
      t.string :encrypted_seed

      t.timestamps
    end
  end
end
