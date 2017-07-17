class CreateUserChangeLogs < ActiveRecord::Migration[5.1]
  def change
    create_table :user_change_logs do |t|
      t.references :user, foreign_key: true

      t.string :old_value
      t.string :new_value
      t.string :column_name

      t.timestamps
    end
  end
end
