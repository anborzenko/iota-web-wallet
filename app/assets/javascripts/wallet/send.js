/**
 * Created by Daniel on 08.06.2017.
 */
function openSendWindow(){
    $('#sendModal').modal('show');

    removeAlert('send-notifications');

    $('#send_address').val('');
}

function openDonationWindow(){
    $('#sendModal').modal('show');

    renderSuccessAlert('send-notifications',
        "<p>If you are happy with our services, donations are very much appreciated. The address field has been " +
        "pre-filled with our donation address.</p>");

    $('#send_address').val(window.iotaDonationAddress);
}

function moveBalanceToSendAmount(){
    $('#amount').val(getSeedBalance());
    document.getElementById('unitDropdownValue').innerHTML = 'i';
}

function onMakeTransactionClick(){
    var send_address = $('#send_address');
    var amount_input = $('#amount');

    var inputAmount = parseFloat(amount_input.val());
    if (!inputAmount || inputAmount <= 0){
        return renderDangerAlert('send-notifications', 'Invalid amount');
    }

    var unit = document.getElementById('unitDropdownValue').innerHTML;
    var amount = convertToIotas(inputAmount, unit);

    removeAlert('send-notifications');
    if (amount > getSeedBalance()) {
        return renderDangerAlert('send-notifications', 'Balance is too low');
    }else if (amount.toString().indexOf('.') !== -1){
        return renderDangerAlert('send-notifications', 'Cannot send fractions of IOTAs');
    }

    var inputs = findInputs(amount);
    if (inputs === null){
        return renderDangerAlert('send-notifications',
            'Not able to load your wallet data. Please contact support if this problem persists');
    }

    // Check for double spends
    $('#send_button').hide();
    var pendingOut = getPendingOut();
    for (var i = 0; i < inputs.length; i++){
        if (isInArray(pendingOut, inputs[i], senderInputAddressComparer)){
            $("#double_spend_confirmation_box").show();
            $("#send_confirmation_box").hide();
            return;
        }
    }

    send_address.prop('disabled', true);
    amount_input.prop('disabled', true);
    $('#unitDropdown').prop('disabled', true);
    $('#message').prop('disabled', true);
    $("#double_spend_confirmation_box").hide();
    $("#send_confirmation_box").show();

    getToAddress(send_address.val(), function(e, res){
        if (e){
            renderDangerAlert('send-notifications', "<b>Error: </b>" + e);
            return restoreSendForm();
        }

        document.getElementById('send_confirmation_message').innerHTML = 'Please confirm sending <b>' + numberWithSpaces(amount) + '</b> IOTAs to ' + res;
    });
}

function onSendClick(btn){
    var inputAmount = parseFloat($('#amount').val());
    var unit = document.getElementById('unitDropdownValue').innerHTML;
    var amount = convertToIotas(inputAmount, unit);
    var message = $('#message').val();

    var l = Ladda.create(document.querySelector( '#confirm_button' ));
    $("#double_spend_confirmation_box").hide();
    $("#send_confirmation_message").hide();
    $("#cancel").hide();
    $("#abort_double_spend").hide();
    $("#send_confirmation_box").show();

    l.start();
    getToAddress($('#send_address').val(), function(e, to_address){
        if (e){
            return onSendFinished(e);
        }

        // The local machine and a server will race to do the pow. Keep track on which one is ahead.
        var maxProgress = 0;
        sendIotas(to_address, amount, message, onSendFinished, function (progress, text) {
            if (progress >= maxProgress) {
                l.setProgress(progress);
                maxProgress = progress;
                document.getElementById('progress_text').innerHTML = text;
            }
        });
    });
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
        renderDangerAlert('send-notifications', "Transfer failed: " + e.message ? e.message : e);
    }else{
        var message = $('#send_address').val() === window.iotaDonationAddress ? 'Thank you :)' : 'Transfer succeeded';
        renderSuccessAlert('send-notifications', message);
        loadWalletData(onGetWalletData);
        savePendingTransaction(response[0].hash);
    }

    restoreSendForm();

    uploadUnspentAddresses(window.numAddressesToSaveOnServer);
    getAndReplayPendingTransaction();
}

function onChooseUnit(btn){
    document.getElementById('unitDropdownValue').innerHTML = btn.innerHTML || 'MI';
}

function getToAddress(input, callback){
    if(validateAddress(input)){
        callback(null, input);
    }else if (input === getUsername()){
        callback(null, window.walletData['latestAddress']);
    }else{
        $.ajax({
            type: "GET",
            url: 'receive_addresses',
            data: {'username': input},
            dataType: "JSON",
            success: function (response) {
                // Find the first address that has not been used in a spend
                if (response.addresses) {
                    var addresses = response.addresses.split(',');
                    iota.api.findTransactionObjects({ 'addresses': addresses }, function(e, res){
                        for (var i = 0; i < addresses.length; i++){
                            var hasBeenSpent = false;
                            for (var j = 0; j < res.length; j++){
                                if (res[j].address === addresses[i] && res[j].value < 0){
                                    hasBeenSpent = true;
                                    break;
                                }
                            }
                            if (!hasBeenSpent){
                                return callback(null, addresses[i]);
                            }
                        }
                        callback('Our data about ' + input + ' is outdated. He or she have to log ' +
                            'in to the wallet over again in order for us to get up to date');
                    });
                }else{
                    callback('We could not find any data about ' + input + '. He or she have to log ' +
                        'in to the wallet over again in order for us to get up to date');
                }
            },
            error: function (error){
                callback('Recipient is not a valid address or username');
            }
        });
    }
}