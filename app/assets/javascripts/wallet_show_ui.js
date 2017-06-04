/**
 * Created by Daniel on 04.06.2017.
 */

let walletData;

function onGetWalletDataFinished(e, accountData) {
    $("#loading").spin(false); // Hide the spinner

    if (e){
        document.getElementById('loading').innerHTML = "<div class='alert alert-danger'>Could not load your wallet. " + e.message + "</div>";
        return;
    }
    walletData = accountData;

    $(document).find('#loading').hide();
    $(document).find('#wallet-data').show();
    populateAddresses();
    populateTransactions();
    populateWalletInfo();
}

function openSendWindow(){
    $('#sendModal').modal('show')
}

function onSendClick(){
    // TODO: Find and validate input
    let amount = 10;
    let to_address = 'abc';
    if (confirm('Please confirm sending ' + amount + ' IOTAs to ' + to_address)){
        sendIotas(to_address, amount);
    }
}

function populateTransactions(){
    if (walletData === null){
        loadWalletData(onGetWalletDataFinished);
        return;
    }
}

function populateAddresses(){
    if (walletData === null){
        loadWalletData(onGetWalletDataFinished);
        return;
    }

    let addresses = walletData.addresses;
    if (addresses.length === 0){
        // TODO: Show you have none
    }else{
        for (let i = 0; i < addresses.length; i++){

        }
    }
}

function populateWalletInfo(){
    if (walletData === null){
        loadWalletData(onGetWalletDataFinished);
        return;
    }

    document.getElementById("wallet_balance_summary").innerHTML = convertBalanceToHtml(walletData.balance);
    document.getElementById("wallet_balance").innerHTML = '<b>' + walletData.balance + '</b> IOTAs';
}

function convertBalanceToHtml(balance){
    let units = ['i', 'Ki', 'Mi', 'Gi', 'Ti', 'Pi'];
    balance = balance.toString();
    const minNumBeforeDecimal = 1;

    let i = Math.floor((balance.length - minNumBeforeDecimal) / 3);
    if (i >= units.length){
        i = units.length-1;
    }

    return '<b>' + iota.utils.convertUnits(balance, units[0], units[i]) + '</b> ' + units[i];
}