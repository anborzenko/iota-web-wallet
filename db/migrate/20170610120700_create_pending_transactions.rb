class CreatePendingTransactions < ActiveRecord::Migration[5.1]
  def change
    create_table :pending_transactions do |t|
      t.string :key
      t.string :tail_hash
      t.datetime :last_replay

      t.timestamps
    end
  end
end
