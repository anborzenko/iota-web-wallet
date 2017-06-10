class PendingTransaction < ApplicationRecord
  validates :key, presence: true, uniqueness: true
  validates :tail_hash, presence: true
  validates :last_replay, presence: true
end
