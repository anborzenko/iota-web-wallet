class CreatePendingTransactions < ActiveRecord::Migration[5.1]
  def change
    create_table :pending_transactions do |t|
      t.string :tail_hash
      t.datetime :last_replay
      t.integer :num_replays

      t.timestamps
    end
  end
end
