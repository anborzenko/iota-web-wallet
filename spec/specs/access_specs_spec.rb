require 'rails_helper.rb'

feature 'Access', js: true do
  scenario 'should not have access to users/show' do
    visit '/users/show'

    sleep 2
    expect(current_path).to eq users_login_path
  end

  scenario 'should not have access to wallets/show' do
    visit '/wallets/show'

    sleep 2

    expect(current_path).to eq users_login_path
  end
end