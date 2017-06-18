/**
 * Created by Daniel on 08.06.2017.
 */
function openSendWindow(){
    document.getElementById('send_balance').innerHTML = 'Limit: ' + getSeedBalance() + ' IOTAs';
    $('#sendModal').modal('show');
}

function moveBalanceToSendAmount(){
    $('#amount').val(getSeedBalance());
    document.getElementById('unitDropdownValue').innerHTML = 'i';
}

function onMakeTransactionClick(){
    var n_div = document.getElementById('send-notifications');
    var send_address = $('#send_address');
    var amount_input = $('#amount');

    var to_address = send_address.val();
    var inputAmount = parseFloat(amount_input.val());
    if (!inputAmount){
        return n_div.innerHTML = "<div class='alert alert-danger'>Invalid amount</div>";
    }

    var unit = document.getElementById('unitDropdownValue').innerHTML;
    var amount = convertToIotas(inputAmount, unit);

    n_div.innerHTML = "";
    if (to_address.length < 1 || !validateAddress(to_address)){
        return n_div.innerHTML = "<div class='alert alert-danger'>Invalid address</div>";
    }else if (amount > getSeedBalance()) {
        return n_div.innerHTML = "<div class='alert alert-danger'>Balance is too low</div>";
    }else if (amount.toString().indexOf('.') !== -1){
        return n_div.innerHTML = "<div class='alert alert-danger'>Cannot send fractions of IOTAs</div>";
    }

    var inputs = findInputs(amount);
    if (inputs === null){
        return n_div.innerHTML = "<div class='alert alert-danger'>Not able to load your wallet data. Please contact support if this problem persists</div>";
    }

    $('#send_button').hide();
    var pendingOut = getPendingOut();
    for (var i = 0; i < inputs.length; i++){
        if (isInArray(pendingOut, inputs[i], senderInputAddressComparer)){
            $("#double_spend_confirmation_box").show();
            $("#send_confirmation_box").hide();
            return;
        }
    }

    $("#double_spend_confirmation_box").hide();
    send_address.prop('disabled', true);
    amount_input.prop('disabled', true);
    $('#unitDropdown').prop('disabled', true);
    $('#message').prop('disabled', true);
    $("#double_spend_confirmation_box").hide();
    $("#send_confirmation_box").show();
    document.getElementById('send_confirmation_message').innerHTML = 'Please confirm sending <b>' + numberWithSpaces(amount) + '</b> IOTAs to ' + to_address;
}

function onSendClick(btn){
    var to_address = $('#send_address').val();
    var inputAmount = parseFloat($('#amount').val());
    var unit = document.getElementById('unitDropdownValue').innerHTML;
    var amount = convertToIotas(inputAmount, unit);
    var message = $('#message').val();

    var l = Ladda.create(btn);
    $("#double_spend_confirmation_box").hide();
    $("#send_confirmation_message").hide();
    $("#cancel").hide();
    $("#abort_double_spend").hide();


    sendIotas(to_address, amount, message, onSendFinished, function (progress, text) {
        l.setProgress(progress);
        document.getElementById('progress_text').innerHTML = text;
    });
    l.start();
}

function restoreSendForm(){
    $("#send_confirmation_message").show();
    $("#abort_double_spend").show();
    $("#cancel").show();
    $('#send_button').show();
    $("#double_spend_confirmation_box").hide();
    $("#send_confirmation_box").hide();

    $('#send_address').prop('disabled', false);
    $('#unitDropdown').prop('disabled', false);
    $('#message').prop('disabled', false);
    $('#amount').prop('disabled', false);

    document.getElementById('progress_text').innerHTML = "";
    Ladda.stopAll();
}

function onSendFinished(e, response){
    window.walletData.maxAddressIndex += 1;
    Ladda.create( document.querySelector( '#send_button' ) ).stop();
    if (e){
        document.getElementById('send-notifications').innerHTML = "<div class='alert alert-danger'>Transfer failed. " + e.message + "</div>";
    }else{
        document.getElementById('send-notifications').innerHTML = "<div class='alert alert-success'>Transfer succeeded</div>";
        loadWalletData(onGetWalletData);
    }

    restoreSendForm();

    getAndReplayPendingTransaction();
    savePendingTransaction(response[0].hash);
}

function onChooseUnit(btn){
    document.getElementById('unitDropdownValue').innerHTML = btn.innerHTML || 'MI';
}