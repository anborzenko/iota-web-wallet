require 'rails_helper.rb'
require 'capybara/rspec'

feature 'Sign up', js: true do
  before :each do
    visit '/users/login'
  end

  scenario 'should succeed with valid credentials' do
    fill_in 'Username', with: 'test'
    fill_in 'Password', with: '12345678'

    click_button 'Sign up'
    wait_for_ajax

    page.execute_script("$('#signUpTab').removeAttr('hidden');")
    fill_in 'Please confirm your password', with: '12345678'

    click_button 'Sign up'
    wait_for_ajax

    expect(page).to have_content 'Loading wallet'
  end

  scenario 'should fail with invalid password' do
    fill_in 'Username', with: 'test'
    fill_in 'Password', with: '1234567'

    click_button 'Sign up'
    wait_for_ajax

    expect(page).to have_content 'Your password must be at least 8 characters long'
  end

  scenario 'should fail with invalid username' do
    fill_in 'Username', with: ''
    fill_in 'Password', with: '12345678'

    click_button 'Sign up'
    wait_for_ajax

    expect(page).to have_content 'Your username cannot be empty'
  end

  scenario 'should fail with existing username' do
    # The password hash translates from 12345678
    user = User.new(username: 'test',
                    password_hash: '-27725094341839359516875540131564445814587500700104682284-916693289-1466390961')
    user.wallet = Wallet.new(encrypted_seed: "{\"iv\":\"xiwlFacOQ7UYy7ysrmoiwg==\",\"v\":1,\"iter\":10000,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"salt\":\"z0M5cFaD1/U=\",\"ct\":\"Lhoo6HSd4dv0QsHlP4L5bpFQDIa0uuPdWyHNdlbgmwME3XO/+So8hdTpLm83CYfjJ50BrAUaTsidjb9tjosDl3q/3xHr5Ww6iLexVgl4pG/Y9Vis8lm1CJU=\"}")
    user.save!

    fill_in 'Username', with: 'test'
    fill_in 'Password', with: '12345678'

    click_button 'Sign up'
    wait_for_ajax

    expect(page).to have_content 'The username is already taken'
  end

  scenario 'should fail with wrong password confirmation' do
    fill_in 'Username', with: 'test'
    fill_in 'Password', with: '12345678'

    click_button 'Sign up'
    wait_for_ajax

    # It is visible at this point, but capybara thinks it's hidden
    page.execute_script("$('#signUpTab').removeAttr('hidden');")
    fill_in 'Please confirm your password', with: '123456789'

    click_button 'Sign up'
    wait_for_ajax

    expect(page).to have_content 'Passwords do not match'
  end

  scenario 'should ask for 2fa confirmation if selected' do
    fill_in 'Username', with: 'test'
    fill_in 'Password', with: '12345678'

    click_button 'Sign up'
    wait_for_ajax

    page.execute_script("$('#signUpTab').removeAttr('hidden');")
    fill_in 'Please confirm your password', with: '12345678'
    check 'enable2FaCheckbox'

    click_button 'Sign up'
    wait_for_ajax

    expect(page).to have_content 'Confirm two-factor authentication'
  end

  scenario '2fa confirmation should succeed if correct otp key is provided' do
    fill_in 'Username', with: 'test'
    fill_in 'Password', with: '12345678'

    click_button 'Sign up'
    wait_for_ajax

    page.execute_script("$('#signUpTab').removeAttr('hidden');")
    fill_in 'Please confirm your password', with: '12345678'
    check 'enable2FaCheckbox'

    click_button 'Sign up'
    wait_for_ajax

    page.execute_script("$('#confirm2fa').removeAttr('hidden');")
    fill_in 'Code:', with: User.find_by_username('test').otp_code
    click_button 'Confirm'

    expect(page).to have_content 'Two factor authentication has been successfully enabled. Redirecting to wallet in 3 seconds'
  end

  scenario '2fa confirmation should fail if wrong otp key is provided' do
    fill_in 'Username', with: 'test'
    fill_in 'Password', with: '12345678'

    click_button 'Sign up'
    wait_for_ajax

    page.execute_script("$('#signUpTab').removeAttr('hidden');")
    fill_in 'Please confirm your password', with: '12345678'
    check 'enable2FaCheckbox'

    click_button 'Sign up'
    wait_for_ajax

    page.execute_script("$('#confirm2fa').removeAttr('hidden');")
    fill_in 'Code:', with: '111'
    click_button 'Confirm'

    expect(page).to have_content 'Invalid key. Try again'
  end
end