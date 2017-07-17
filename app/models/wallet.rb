class Wallet < ApplicationRecord
  belongs_to :user
  belongs_to :deleted_user, optional: true

  validates :encrypted_seed, presence: true
  validates :user, presence: true
end
