class PendingTransaction < ApplicationRecord
  validates :tail_hash, presence: true, uniqueness: true
  validates :last_replay, presence: true
end
