require 'rails_helper.rb'
require 'capybara/rspec'

feature 'Send from wallet', js: true do
  before :each do
    # This spec assumes the seed balance to be 1 i or more and less than 1 Mi
    establish_session('seed')# TODO: Some seed with the correct balance
    wait_for_ajax
  end

  scenario 'should see transaction panel' do
    expect(page).to have_content 'Transactions'
  end

  scenario 'should be unable to send iotas without balance' do
    click_on 'Make transfer'
    wait_for_ajax

    fill_in 'recipient', with: 'address'
    fill_in 'Amount:', with: '1' # Assume the balance to be less than 1 Mi

    click_button 'Make transaction'
    wait_for_ajax

    expect(page).to have_content 'Balance is too low'
  end

  scenario 'should be unable to send iotas to invalid address' do
    click_on 'Make transfer'
    wait_for_ajax

    fill_in 'recipient', with: 'abc'
    fill_in 'Amount:', with: '1'
    select("i", from: "unitDropdown").select_option

    click_button 'Make transaction'
    wait_for_ajax

    expect(page).to have_content 'Recipient is not a valid address or username'
  end

  scenario 'should be able to send iotas' do
    click_on 'Make transfer'
    wait_for_ajax

    fill_in 'recipient', with: 'abc'# TODO: Some valid address
    fill_in 'Amount:', with: '1'
    select("i", from: "unitDropdown").select_option

    click_button 'Make transaction'

    # This could take some time
    Capybara.default_max_wait_time = 3000
    wait_for_ajax
    Capybara.default_max_wait_time = 30

    expect(page).to have_content 'Transfer succeeded'
  end

  private

  def establish_session(seed)
    click_on 'Use seed'
    wait_for_ajax

    fill_in 'Seed', with: seed

    click_button 'Open'
    wait_for_ajax

    expect(page).to have_content 'Loading wallet'

    wait_for_ajax
  end
end