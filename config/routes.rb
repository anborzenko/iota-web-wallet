Rails.application.routes.draw do
  get 'page/index'
  get 'page/about'
  get 'page/help'

  get 'wallets/show'
  get 'wallets/login'
  get 'wallets/signup'
  root 'page#index'

  # For details on the DSL available within this file, see http://guides.rubyonrails.org/routing.html
end
