class RemoveNode < ActiveRecord::Migration[5.1]
  def change
    drop_table :nodes
  end
end
