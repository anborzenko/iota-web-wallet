require 'rails_helper.rb'
require 'capybara/rspec'

feature 'Creating posts' do
  #before :each do
  #  User.make(email: 'user@example.com', password: 'password')
  #end

  scenario 'should display_login' do
    visit '/'
    expect(page).to have_content('Sign in')
  end

  scenario 'should display_new_user' do
    visit '/'
    expect(page).to have_content('New user')
  end

  scenario 'should display_navbar' do
    visit '/'
    expect(page).to have_content('Home')
    expect(page).to have_content('About')
    expect(page).to have_content('Wallet')
  end
end