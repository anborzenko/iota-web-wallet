/**
 * Created by Daniel on 04.06.2017.
 */

var walletData;

// TODO: Periodically update the wallet information

function onGetWalletDataFinished(e, accountData) {
    $("#loading").spin(false); // Hide the spinner

    if (e){
        document.getElementById('loading').innerHTML = "<div class='alert alert-danger'>Could not load your wallet. Please check the node health. " + e.message + "</div>";
        return;
    }
    walletData = accountData;

    $(document).find('#loading').hide();
    $(document).find('#wallet-data').show();
    populateWalletInfo(walletData);
    populateTransactions(walletData);
}

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
    if(inputs.length === 0 && walletData.inputs.length !== 0){
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

    var inputs = findInputs();
    var options = inputs && inputs.length > 0 ? {inputs: findInputs()} : {};

    sendIotas(to_address, amount, message, onSendFinished, options);
    var l = Ladda.create(btn);
    l.start();
}

function restoreSendForm(){
    $("#double_spend_confirmation_box").hide();
    $("#send_confirmation_box").hide();
    $('#send_button').show();
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
}

function populateWalletInfo(data){
    $("#seed_box").val(getSeed());
    document.getElementById("wallet_balance_summary").innerHTML = convertIotaValuesToHtml(data.balance);
    document.getElementById("wallet_balance").innerHTML = '<b>' + data.balance + '</b> IOTAs';
    $('#address_box').val(addChecksum(data.latestAddress));
}

function convertIotaValuesToHtml(value){
    var units = ['i', 'Ki', 'Mi', 'Gi', 'Ti', 'Pi'];
    value = value.toString();
    const minNumBeforeDecimal = 1;

    var i = Math.floor((value.length - minNumBeforeDecimal) / 3);
    if (i >= units.length){
        i = units.length-1;
    }

    return '<b>' + Math.floor(iota.utils.convertUnits(value, units[0], units[i])) + '</b> ' + units[i];
}

function showSeed(){
    document.getElementById('seed_box').type = 'text';
}

function onGenerateAddressClick(){
    if (!walletData){
        return;
    }
    $("#refresh_address_glyph").attr('class', 'glyphicon glyphicon-refresh glyphicon-refresh-animate');
    document.getElementById('address_generation_status').innerHTML = 'Attaching';
    attachAddress(walletData.latestAddress, onAttachBeforeGenerateAddressCallback);
}

function onAttachBeforeGenerateAddressCallback(e, res){
    if (e){
        document.getElementById('address_generation_status').innerHTML = 'Failed';
        $("#refresh_address_glyph").attr('class', 'glyphicon glyphicon-refresh');
        return document.getElementById('wallet_show_notifications').innerHTML =
            "<div class='alert alert-danger'>Failed to generate new address. " + e.message + "</div>";
    }

    document.getElementById('address_generation_status').innerHTML = 'Generating';
    generateNewAddress(onGenerateAddressCallback);
}

function onGenerateAddressCallback(e, res){
    $("#refresh_address_glyph").attr('class', 'glyphicon glyphicon-refresh');

    if (e){
        document.getElementById('address_generation_status').innerHTML = 'Failed';
        return document.getElementById('wallet_show_notifications').innerHTML =
            "<div class='alert alert-danger'>Failed to generate new address. " + e.message + "</div>";
    }
    res = addChecksum(res);
    $('#address_box').val(res);
    walletData.latestAddress = res;
    document.getElementById('address_generation_status').innerHTML = 'Done';
}