class Wallet < ApplicationRecord
  validates :username, presence: true, uniqueness: true
  validates :encrypted_seed, presence: true
  has_one_time_password
end
