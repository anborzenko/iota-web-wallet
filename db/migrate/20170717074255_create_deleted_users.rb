class CreateDeletedUsers < ActiveRecord::Migration[5.1]
  def change
    create_table :deleted_users do |t|
      t.string :username
      t.string :password_hash

      t.timestamps
    end

    add_reference :wallets, :deleted_user
  end
end
