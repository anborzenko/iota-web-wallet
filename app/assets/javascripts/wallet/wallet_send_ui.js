/**
 * Created by Daniel on 08.06.2017.
 */
function openSendWindow(){
    $('#sendModal').modal('show');
    document.getElementById('send_balance').innerHTML = 'Limit: ' + walletData.balance + ' IOTAs';
}

function moveBalanceToSendAmount(){
    $('#amount').val(walletData.balance);
}

function onMakeTransactionClick(){
    var to_address = $('#send_address').val();
    var amount = parseInt($('#amount').val());
    var message = $('#message').val();

    var n_div = document.getElementById('send-notifications');
    n_div.innerHTML = "";
    if (to_address.length < 1 || !validateAddress(to_address)){
        return n_div.innerHTML = "<div class='alert alert-danger'>Invalid address</div>";
    }else if ((!amount && amount !== 0) || amount > walletData.balance) {
        return n_div.innerHTML = "<div class='alert alert-danger'>Invalid amount</div>";
    }

    var inputs = findInputs();

    if (inputs === null){
        return n_div.innerHTML = "<div class='alert alert-danger'>Not able to load your wallet data. Please contact support if this problem persists</div>";
    }

    $('#send_button').hide();
    if(inputs.length === 0 && amount !== 0){
        $("#double_spend_confirmation_box").show();
        $("#send_confirmation_box").hide()
    }else{
        $("#double_spend_confirmation_box").hide();
        $("#send_confirmation_box").show();
        document.getElementById('send_confirmation_message').innerHTML = 'Please confirm sending ' + amount + ' IOTAs to ' + to_address;
    }
}

function onSendClick(btn){
    var to_address = $('#send_address').val();
    var amount = parseInt($('#amount').val());
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
    getAndReplayPendingTransaction();
}

function restoreSendForm(){
    $("#send_confirmation_message").show();
    $("#abort_double_spend").show();
    $("#cancel").show();
    $('#send_button').show();
    $("#double_spend_confirmation_box").hide();
    $("#send_confirmation_box").hide();

    document.getElementById('progress_text').innerHTML = "";
    Ladda.stopAll();
}

function onSendFinished(e, response){
    Ladda.create( document.querySelector( '#send_button' ) ).stop();
    if (e){
        if (e.message === 'Double spend'){
            $('#confirmation_box').show();
        }else{
            document.getElementById('send-notifications').innerHTML = "<div class='alert alert-danger'>Transfer failed. " + e.message + "</div>";
        }
    }else{
        document.getElementById('send-notifications').innerHTML = "<div class='alert alert-success'>Transfer succeeded</div>";
        loadWalletData(onGetWalletDataFinished);
    }

    restoreSendForm();

    savePendingTransaction(response[0].hash);
}