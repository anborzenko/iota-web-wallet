class CreateUsers < ActiveRecord::Migration[5.1]
  def change
    create_table :users do |t|
      t.belongs_to :wallet, index: { unique: true }, foreign_key: true

      t.string :username
      t.string :otp_secret_key
      t.boolean :has2fa
      t.boolean :has_confirmed_2fa
      t.string :password_hash

      t.timestamps
    end
  end
end
