require 'rails_helper.rb'
require 'capybara/rspec'

feature 'Show user', js: true do
  before :each do
    # The password hash translates from 12345678
    user = User.new(username: 'test',
                    password_hash: '-27725094341839359516875540131564445814587500700104682284-916693289-1466390961')
    user.wallet = Wallet.new(encrypted_seed: "{\"iv\":\"xiwlFacOQ7UYy7ysrmoiwg==\",\"v\":1,\"iter\":10000,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"salt\":\"z0M5cFaD1/U=\",\"ct\":\"Lhoo6HSd4dv0QsHlP4L5bpFQDIa0uuPdWyHNdlbgmwME3XO/+So8hdTpLm83CYfjJ50BrAUaTsidjb9tjosDl3q/3xHr5Ww6iLexVgl4pG/Y9Vis8lm1CJU=\"}")
    user.save!

    # Establish a session
    visit :users_login_path, username: user.username, password_hash: user.password_hash

    visit :users_show_path
  end

  scenario 'should see menu' do
    expect(page).to have_content 'Account'
    expect(page).to have_content 'Settings'
    expect(page).to have_content 'Advanced'
  end

  scenario 'should see account' do
    expect(page).to have_content 'test' # Username
    expect(page).to have_content 'Disabled' # 2fa
  end

  scenario 'should be able to change username' do
    click_on 'Settings'
    wait_for_ajax

    fill_in 'Username', with: 'test2'
    fill_in 'Confirm password:', with: '12345678'

    click_button 'Save'
    wait_for_ajax

    expect(page).to have_content 'Updated'
    expect(page).to have_content 'test2'
  end

  scenario 'should not be able to change username with wrong password' do
    click_on 'Settings'
    wait_for_ajax

    fill_in 'Username', with: 'test2'
    fill_in 'Confirm password:', with: '123456789'

    click_button 'Save'
    wait_for_ajax

    expect(page).to have_content 'Wrong pasword'
  end

  scenario 'should be able to activate 2fa' do
    click_on 'Settings'
    wait_for_ajax

    fill_in 'Confirm password:', with: '12345678'
    click_button 'Enable'
    wait_for_ajax

    expect(page).to have_content 'Two-factor authentications has been enabled. Please log back in to complete the process'
  end

  scenario 'should be able to deactivate 2fa' do
    user = User.find_by_username('test')
    user.has2fa = true
    user.has_confirmed_2fa = true
    user.save!

    click_on 'Settings'
    wait_for_ajax

    fill_in 'Confirm password:', with: '12345678'
    fill_in 'Two-factor key:', with: user.otp_code
    click_button 'Disable'
    wait_for_ajax

    expect(page).to have_content 'Two-factor authentication has been disabled'
  end

  scenario 'should not be able to deactivate 2fa with invalid otp key' do
    user = User.find_by_username('test')
    user.has2fa = true
    user.has_confirmed_2fa = true
    user.save!

    click_on 'Settings'
    wait_for_ajax

    fill_in 'Confirm password:', with: '12345678'
    fill_in 'Two-factor key:', with: '111'
    click_button 'Disable'
    wait_for_ajax

    expect(page).to have_content 'Invalid two-factor key. Try again'
  end

  scenario 'should be able to delete account' do
    click_on 'Advanced'
    wait_for_ajax

    fill_in 'Confirm password:', with: '12345678'
    click_button 'Delete account'
    wait_for_ajax

    click_button 'Yes, delete it'
    wait_for_ajax

    expect(page).to have_content 'Your account has been deleted. Redirecting in 5 seconds'
  end

  scenario 'should not be able to see anything without a session' do
    get :users_logout_path
    visit :users_show_path

    expect(page).not_to have_content 'Account'
    expect(page).not_to have_content 'Settings'
    expect(page).not_to have_content 'Advanced'
  end
end