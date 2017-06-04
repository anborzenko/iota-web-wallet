class Wallet < ApplicationRecord
  validates :username, presence: true, uniqueness: true
  validates :encrypted_seed, presence: true
end
