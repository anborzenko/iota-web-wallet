require 'rails_helper.rb'
require 'capybara/rspec'

feature 'Deactivate 2fa', js: true do
  before :each do
    # The password hash translates from 12345678
    user = User.new(username: 'test',
                    password_digest: '$2a$10$gcs7ZCw5o0BV8D6uLbxNIur/Fl1niqkaTm1UFz4zGCPDQrc8rS5BK',
                    has2fa: true,
                    has_confirmed_2fa: true)
    user.wallet = Wallet.new(encrypted_seed: "{\"iv\":\"xiwlFacOQ7UYy7ysrmoiwg==\",\"v\":1,\"iter\":10000,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"salt\":\"z0M5cFaD1/U=\",\"ct\":\"Lhoo6HSd4dv0QsHlP4L5bpFQDIa0uuPdWyHNdlbgmwME3XO/+So8hdTpLm83CYfjJ50BrAUaTsidjb9tjosDl3q/3xHr5Ww6iLexVgl4pG/Y9Vis8lm1CJU=\"}")
    user.save!

    establish_session('test', '12345678', user.otp_code)

    visit '/users/show'
  end

  scenario 'should be able to deactivate 2fa' do
    click_on 'Settings'
    wait_for_ajax

    fill_in 'Confirm password:', with: '12345678'
    fill_in 'Two-factor key:', with: User.find_by_username('test').otp_code
    find('#settings_2fa_toggle').click
    click_button 'Save'
    wait_for_ajax

    expect(page).to have_content 'Update was successful'
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
    find('#settings_2fa_toggle').click
    click_button 'Save'
    wait_for_ajax

    expect(page).to have_content 'Invalid two-factor key. Try again'
  end

  private

  def establish_session(username, pass, otp_code)
    visit '/users/login'
    fill_in 'Username', with: username
    fill_in 'Password', with: pass

    click_button 'Open wallet'
    wait_for_ajax

    page.execute_script("$('#login2faTab').removeAttr('hidden');")
    fill_in 'Code:', with: otp_code

    click_button 'Confirm'
    wait_for_ajax
  end
end