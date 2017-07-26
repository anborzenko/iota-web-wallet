Rails.application.routes.draw do
  get 'users/show'
  post 'users/update'
  get 'users/login'
  get 'users/seed_login'
  get 'users/logout'
  post 'users/confirm2fa'
  post 'users/signup'

  get 'admin/dashboard'
  get 'admin/index'
  get 'admin/login'
  get 'admin/get_data'

  get 'page/index'
  get 'page/about'
  get 'page/help'
  get 'page/donate'

  get 'wallets/show'
  get 'wallets/seed_checker'
  get 'wallets/details'
  get 'wallets/get_next_pending_transaction'
  delete 'wallets/delete_pending_transaction'
  post 'wallets/add_pending_transaction'
  post 'wallets/add_addresses'
  get 'wallets/receive_addresses'

  get 'nodes/index'

  root 'page#index'
end
