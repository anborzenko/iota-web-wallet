class User < ApplicationRecord
  validates :username, presence: true, uniqueness: true
  has_one_time_password

  has_one :wallet
end
