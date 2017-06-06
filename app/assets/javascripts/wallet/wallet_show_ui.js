/**
 * Created by Daniel on 04.06.2017.
 */

var walletData;

// TODO: Attach the address when the user interacts with the input or button
// TODO: Periodically update the wallet information

function onGetWalletDataFinished(e, accountData) {
    $("#loading").spin(false); // Hide the spinner
    $(document).find('#loading').hide();

    if (e){
        document.getElementById('loading').innerHTML = "<div class='alert alert-danger'>Could not load your wallet. " + e.message + "</div>";
        return;
    }
    walletData = accountData;

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

function onSendClick(){
    var to_address = $('#send_address').val();
    var amount = parseInt($('#amount').val());
    var message = $('#message').val();

    var n_div = document.getElementById('send-notifications');
    n_div.innerHTML = "";
    if (to_address.length < 1 || !validateAddress(to_address)){
        n_div.innerHTML = "<div class='alert alert-danger'>Invalid address</div>";
    }else if ((!amount && amount !== 0) || amount > walletData.balance){
        n_div.innerHTML = "<div class='alert alert-danger'>Invalid amount</div>";
    }else if (confirm('Please confirm sending ' + amount + ' IOTAs to ' + to_address)){
        sendIotas(to_address, amount, message, onSendFinished);
        var l = Ladda.create( document.querySelector( '#send_button' ) );
        l.start();
    }
}

function onSendFinished(e, response){
    Ladda.create( document.querySelector( '#send_button' ) ).stop();
    if (e){
        document.getElementById('send-notifications').innerHTML = "<div class='alert alert-success'>Transfer failed. " + e.message + "</div>";
    }else{
        document.getElementById('send-notifications').innerHTML = "<div class='alert alert-success'>Transfer succeeded</div>";
        loadWalletData(onGetWalletDataFinished);
    }
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

    return '<b>' + iota.utils.convertUnits(value, units[0], units[i]) + '</b> ' + units[i];
}