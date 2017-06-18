class CreateAdmins < ActiveRecord::Migration[5.1]
  def change
    create_table :admins do |t|
      t.integer :level
      t.string :pk

      t.timestamps
    end
  end
end
