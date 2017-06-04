require 'test_helper'

class WalletsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @wallet = wallets(:one)
  end

  test "should get index" do
    get wallets_url
    assert_response :success
  end

  test "should get new" do
    get new_wallet_url
    assert_response :success
  end

  test "should create wallets" do
    assert_difference('Wallet.count') do
      post wallets_url, params: {wallets: {email: @wallet.email, encrypted_seed: @wallet.encrypted_seed } }
    end

    assert_redirected_to wallet_url(Wallet.last)
  end

  test "should show wallets" do
    get wallet_url(@wallet)
    assert_response :success
  end

  test "should get edit" do
    get edit_wallet_url(@wallet)
    assert_response :success
  end

  test "should update wallets" do
    patch wallet_url(@wallet), params: {wallets: {email: @wallet.email, encrypted_seed: @wallet.encrypted_seed } }
    assert_redirected_to wallet_url(@wallet)
  end

  test "should destroy wallets" do
    assert_difference('Wallet.count', -1) do
      delete wallet_url(@wallet)
    end

    assert_redirected_to wallets_url
  end
end
