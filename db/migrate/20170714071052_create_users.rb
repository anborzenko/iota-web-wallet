class CreateUsers < ActiveRecord::Migration[5.1]
  def change
    create_table :users do |t|
      t.string :username
      t.string :otp_secret_key
      t.boolean :has2fa
      t.boolean :has_confirmed_2fa
      t.string :password_hash

      t.timestamps
    end

    add_reference :wallets, :user, index: true
  end
end
