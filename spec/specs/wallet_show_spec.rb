require 'rails_helper.rb'
require 'capybara/rspec'

feature 'Show wallet', js: true do
  before :each do
    # The password hash translates from 12345678
    user = User.new(username: 'test',
                    password_digest: '$2a$10$gcs7ZCw5o0BV8D6uLbxNIur/Fl1niqkaTm1UFz4zGCPDQrc8rS5BK')
    user.wallet = Wallet.new(encrypted_seed: "{\"iv\":\"xiwlFacOQ7UYy7ysrmoiwg==\",\"v\":1,\"iter\":10000,\"ks\":128,\"ts\":64,\"mode\":\"ccm\",\"adata\":\"\",\"cipher\":\"aes\",\"salt\":\"z0M5cFaD1/U=\",\"ct\":\"Lhoo6HSd4dv0QsHlP4L5bpFQDIa0uuPdWyHNdlbgmwME3XO/+So8hdTpLm83CYfjJ50BrAUaTsidjb9tjosDl3q/3xHr5Ww6iLexVgl4pG/Y9Vis8lm1CJU=\"}")
    user.save!

    establish_session('test', '12345678')
    wait_for_ajax
  end

  scenario 'should see wallet' do
    expect(page).to have_content 'Your wallet'
  end

  scenario 'should see transaction panel' do
    expect(page).to have_content 'History'
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