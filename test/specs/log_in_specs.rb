require 'rails_helper.rb'
require 'capybara/rspec'

feature 'Log in' do
  before :each do
    user = User.new(username: 'test', password_hash: 'test_pass')
    # TODO: Need a real encrypted seed
    user.wallet = Wallet.new(encrypted_seed: 'test_seed')
    user.save!

    visit '/users/login'
  end

  scenario 'should log in with valid credentials' do
    fill_in 'Username', with: 'test'
    fill_in 'Password', with: 'test_pass'

    click_button 'Log in'

    expect(page).to have_content 'Loading wallet'
  end

  scenario 'should fail with invalid password' do
    fill_in 'Username', with: 'test'
    fill_in 'Password', with: 'wrong_pass'

    click_button 'Log in'

    expect(page).to have_content 'Invalid password'
  end

  scenario 'should fail with invalid username' do
    fill_in 'Username', with: 'invalid_test'
    fill_in 'Password', with: 'test_pass'

    click_button 'Log in'

    expect(page).to have_content 'Username not found'
  end

  scenario 'should ask for 2fa if enabled' do
    user = User.new(username: 'test_2fa', password_hash: 'test_pass', has_2fa: true)
    user.wallet = Wallet.new(encrypted_seed: 'test_seed')
    user.save!

    fill_in 'Username', with: 'test_2fa'
    fill_in 'Password', with: 'test_pass'

    click_button 'Log in'

    expect(page).to have_content 'Enter your two-factor authentication code'
  end
end