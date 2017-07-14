class Wallet < ApplicationRecord
  validates :encrypted_seed, presence: true

  belongs_to :user
end
