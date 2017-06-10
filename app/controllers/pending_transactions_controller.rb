class PendingTransactionsController < ApplicationController
  def get_next
    oldest = PendingTransaction.order(:last_replay).limit(1)
    if oldest.nil?
      raise 'There is no next'
    end

    min_wait_time = 10 # The minimum number of minutes between each replay
    if (DateTime.current - oldest.last_replay) * 24 * 60 < min_wait_time
      raise 'It\'s too soon'
    end

    oldest.last_replay = DateTIme.current
    oldest.save
    oldest
  end

  def delete
    key = params[:key]
    PendingTransaction.find_by_key(key).destroy
  end

  def add
    tail_hash = params[:tail_hash]
    key = SecureRandom.base64
    PendingTransaction.create(key: key, tail_hash: tail_hash, last_replay: DateTime.current)
  end
end
