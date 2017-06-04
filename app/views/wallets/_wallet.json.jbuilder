json.extract! wallet, :id, :email, :encrypted_seed, :created_at, :updated_at
json.url wallet_url(wallet, format: :json)
