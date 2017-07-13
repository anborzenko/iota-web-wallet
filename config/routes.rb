Rails.application.routes.draw do
  get 'users/show'

  get 'users/update'

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
  get 'wallets/custom_send'
  get 'wallets/details'
  get 'wallets/login'
  get 'wallets/exists'
  get 'wallets/confirm2fa'
  get 'wallets/signup'
  get 'wallets/get_next_pending_transaction'
  get 'wallets/delete_pending_transaction'
  get 'wallets/add_pending_transaction'
  get 'wallets/add_addresses'
  get 'wallets/receive_addresses'

  get 'nodes/index'

  root 'page#index'
end
