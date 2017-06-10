Rails.application.routes.draw do
  get 'page/index'
  get 'page/about'
  get 'page/help'

  get 'wallets/show'
  get 'wallets/login'
  get 'wallets/signup'
  get 'wallets/settings'
  get 'nodes/index'
  get 'pending_transactions/get_next'
  get 'pending_transactions/delete'
  get 'pending_transactions/add'
  root 'page#index'
end
