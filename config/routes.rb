Rails.application.routes.draw do
  get 'admin/dashboard'
  get 'admin/index'
  get 'admin/login'
  get 'admin/get_data'

  get 'page/index'
  get 'page/about'
  get 'page/help'
  get 'page/donate'

  get 'wallets/show'
  get 'wallets/login'
  get 'wallets/signup'
  get 'wallets/settings'
  get 'nodes/index'
  get 'wallets/get_next_pending_transaction'
  get 'wallets/delete_pending_transaction'
  get 'wallets/add_pending_transaction'
  root 'page#index'
end
