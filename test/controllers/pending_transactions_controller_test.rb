require 'test_helper'

class PendingTransactionsControllerTest < ActionDispatch::IntegrationTest
  setup do
    @pending_transaction = pending_transactions(:one)
  end

  test "should get index" do
    get pending_transactions_url
    assert_response :success
  end

  test "should get new" do
    get new_pending_transaction_url
    assert_response :success
  end

  test "should create pending_transaction" do
    assert_difference('PendingTransaction.count') do
      post pending_transactions_url, params: { pending_transaction: {  } }
    end

    assert_redirected_to pending_transaction_url(PendingTransaction.last)
  end

  test "should show pending_transaction" do
    get pending_transaction_url(@pending_transaction)
    assert_response :success
  end

  test "should get edit" do
    get edit_pending_transaction_url(@pending_transaction)
    assert_response :success
  end

  test "should update pending_transaction" do
    patch pending_transaction_url(@pending_transaction), params: { pending_transaction: {  } }
    assert_redirected_to pending_transaction_url(@pending_transaction)
  end

  test "should destroy pending_transaction" do
    assert_difference('PendingTransaction.count', -1) do
      delete pending_transaction_url(@pending_transaction)
    end

    assert_redirected_to pending_transactions_url
  end
end
