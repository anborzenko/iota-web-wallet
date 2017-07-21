require 'rails_helper.rb'
require 'capybara/rspec'

feature 'Show user', js: true do
  before :each do
    # The password hash translates from 12345678
    user = User.new(username: 'test',
                    password_digest: '$2a$10$gcs7ZCw5o0BV8D6uLbxNIur/Fl1niqkaTm1UFz4zGCPDQrc8rS5BK')
    user.wallet = Wallet.new(encrypted_seed: "{\"iv\":\"xiwlFacOQ7UYy7ysrmoiwg==\",\"v\":1,\"iter\":10000,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"salt\":\"z0M5cFaD1/U=\",\"ct\":\"Lhoo6HSd4dv0QsHlP4L5bpFQDIa0uuPdWyHNdlbgmwME3XO/+So8hdTpLm83CYfjJ50BrAUaTsidjb9tjosDl3q/3xHr5Ww6iLexVgl4pG/Y9Vis8lm1CJU=\"}")
    user.save!

    establish_session('test', '12345678')

    visit '/users/show'
  end

  scenario 'should see menu' do
    expect(page).to have_content 'Account'
    expect(page).to have_content 'Settings'
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

    expect(page).to have_content 'Update was successful'
    expect(page).to have_content 'test2'
  end

  scenario 'should not be able to change username with wrong password' do
    click_on 'Settings'
    wait_for_ajax

    fill_in 'Username', with: 'test2'
    fill_in 'Confirm password:', with: '123456789'

    click_button 'Save'
    wait_for_ajax

    expect(page).to have_content 'Invalid password'
  end

  scenario 'should not be able to see anything without a session' do
    find('#sign_out').click
    wait_for_ajax
    visit '/users/show'

    expect(page).not_to have_content 'Account'
    expect(page).not_to have_content 'Settings'
  end

  scenario 'should be able to activate 2fa' do
    click_on 'Settings'
    wait_for_ajax

    fill_in 'Confirm password:', with: '12345678'
    find('#settings_2fa_toggle').click
    click_button 'Save'
    wait_for_ajax

    expect(page).to have_content 'Update was successful'
  end

  private

  def establish_session(username, pass)
    visit '/users/login'
    fill_in 'Username', with: username
    fill_in 'Password', with: pass

    click_button 'Open wallet'
    wait_for_ajax
  end
end