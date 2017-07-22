class User < ApplicationRecord
  has_one_time_password
  has_secure_password

  has_one :wallet

  validates :username, presence: true, uniqueness: true
  validates :wallet, presence: true
end
