class Wallet < ApplicationRecord
  belongs_to :user

  validates :encrypted_seed, presence: true
  validates :user, presence: true
end
