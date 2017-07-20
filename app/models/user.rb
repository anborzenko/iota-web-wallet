class User < ApplicationRecord
  has_one_time_password
  has_secure_password

  has_one :wallet
  has_many :user_change_logs

  validates :username, presence: true, uniqueness: true
  validates :wallet, presence: true
end
