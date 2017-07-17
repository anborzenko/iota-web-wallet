require 'test_helper'

class UserTest < ActiveSupport::TestCase
  test 'username must be unique' do
    User.destroy_all

    attribs = { username: 'test' }

    user = User.new(attribs)
    user.wallet = Wallet.new(encrypted_seed: 'test_seed')
    user.save!

    user = User.new(attribs)
    user.wallet = Wallet.new(encrypted_seed: 'test_seed')
    assert_not user.save
  end
end
