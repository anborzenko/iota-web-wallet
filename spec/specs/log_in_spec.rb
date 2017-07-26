require 'rails_helper.rb'

feature 'Log in', js: true do
  before :each do
    # The password hash translates from 12345678
    user = User.new(username: 'test',
                    password_digest: '$2a$10$gcs7ZCw5o0BV8D6uLbxNIur/Fl1niqkaTm1UFz4zGCPDQrc8rS5BK')
    user.wallet = Wallet.new(encrypted_seed: "{\"iv\":\"xiwlFacOQ7UYy7ysrmoiwg==\",\"v\":1,\"iter\":10000,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"salt\":\"z0M5cFaD1/U=\",\"ct\":\"Lhoo6HSd4dv0QsHlP4L5bpFQDIa0uuPdWyHNdlbgmwME3XO/+So8hdTpLm83CYfjJ50BrAUaTsidjb9tjosDl3q/3xHr5Ww6iLexVgl4pG/Y9Vis8lm1CJU=\"}")
    user.save!

    visit '/users/login'
  end

  scenario 'should log in with valid credentials' do
    fill_in 'Username', with: 'test'
    fill_in 'Password', with: '12345678'

    click_button 'Open wallet'
    wait_for_ajax

    expect(page).to have_content 'Loading wallet'
  end

  scenario 'should fail with invalid password' do
    fill_in 'Username', with: 'test'
    fill_in 'Password', with: '123456789'

    click_button 'Open wallet'
    wait_for_ajax

    expect(page).to have_content 'Invalid username or password'
  end

  scenario 'should fail with invalid username' do
    fill_in 'Username', with: 'invalid_test'
    fill_in 'Password', with: '12345678'

    click_button 'Open wallet'
    wait_for_ajax

    expect(page).to have_content 'Invalid username or password'
  end

  scenario 'should ask for 2fa if enabled' do
    user = User.find_by_username('test')
    user.has2fa = true
    user.has_confirmed_2fa = true
    user.save!

    fill_in 'Username', with: 'test'
    fill_in 'Password', with: '12345678'

    click_button 'Open wallet'
    wait_for_ajax

    expect(page).to have_content 'Enter your two-factor authentication code'
  end

  scenario 'should ask for 2fa confirmation if not confirmed' do
    user = User.find_by_username('test')
    user.has2fa = true
    user.has_confirmed_2fa = false
    user.save!

    fill_in 'Username', with: 'test'
    fill_in 'Password', with: '12345678'

    click_button 'Open wallet'
    wait_for_ajax

    expect(page).to have_content 'Confirm two-factor authentication'
  end

  scenario 'can log in with valid seed' do
    click_on 'Use seed'
    wait_for_ajax

    fill_in 'Seed', with: 'A' * 81

    click_button 'Open'
    wait_for_ajax

    expect(page).to have_content 'Loading wallet'

    wait_for_ajax
    expect(page).to have_content 'Your wallet'
  end

  scenario 'cannot log in with invalid seed' do
    click_on 'Use seed'
    wait_for_ajax

    fill_in 'Seed', with: 'a' * 81

    click_button 'Open'
    wait_for_ajax

    expect(page).to have_content 'Invalid seed'
  end
end