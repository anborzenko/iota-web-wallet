/**
 * Created by Daniel on 04.06.2017.
 */

function onGetWalletData(e, accountData, progress) {
    if (window.location.href.indexOf('wallets/show') === -1){
        return;
    }
    $("#loading").spin(false); // Hide the spinner

    if (e){
        document.getElementById('loading').innerHTML = "<div class='alert alert-danger'>Could not load your wallet. Please check the node health. " + e.message + "</div>";
        return;
    }
    addWalletData(accountData);

    $(document).find('#loading').hide();
    $(document).find('#wallet-data').show();

    if (progress) {
        document.getElementById('transactionLoadStatus').innerHTML = (progress ? progress : 0) + '%';
    }
    populateWallet(window.walletData);
    populateTransactions(accountData);
}

function populateWallet(data){
    $("#seed_box").val(getSeed());
    document.getElementById("wallet_balance_summary").innerHTML = convertIotaValuesToHtml(getSeedBalance());
    document.getElementById("wallet_balance").innerHTML = '<b>' + getSeedBalance() + '</b> IOTAs';
    $('#address_box').val(addChecksum(data.latestAddress));
}

function convertIotaValuesToHtml(value){
    value = value.toString();
    var minNumBeforeDecimal = 1;

    var i = Math.floor((value.length - minNumBeforeDecimal) / 3);
    if (i >= window.units.length){
        i = window.units.length-1;
    }

    return '<b>' + Math.floor(window.iota.utils.convertUnits(value, window.units[0], window.units[i])) + '</b> ' + window.units[i];
}

function showSeed(){
    document.getElementById('seed_box').type = 'text';
}

function onGenerateAddressClick(){
    if (!window.walletData){
        return;
    }
    var status = document.getElementById('refresh_address');
    status.onclick = function() {};
    status.innerHTML = 'Attaching. Please wait..';
    attachAddress(window.walletData.latestAddress, onAttachBeforeGenerateAddressCallback);
}

function onAttachBeforeGenerateAddressCallback(e, res){
    if (e){
        resetAddressGenerationInput();
        return document.getElementById('wallet_show_notifications').innerHTML =
            "<div class='alert alert-danger'>Failed to generate new address. " + e.message + "</div>";
    }

    document.getElementById('refresh_address').innerHTML = 'Generating. Please wait..';
    generateNewAddress(onGenerateAddressCallback);
}

function onGenerateAddressCallback(e, res){
    resetAddressGenerationInput();

    if (e){
        return document.getElementById('wallet_show_notifications').innerHTML =
            "<div class='alert alert-danger'>Failed to generate new address. " + e.message + "</div>";
    }

    res = addChecksum(res);
    $('#address_box').val(res);
    window.walletData.latestAddress = res;
    document.getElementById('wallet_show_notifications').innerHTML = "<div class='alert alert-success'>A new address was generated</div>";
}

function resetAddressGenerationInput(){
    var status = document.getElementById('refresh_address');
    status.onclick = function() {onGenerateAddressClick()};

    status.innerHTML = 'Generate new address';
    onTxLoadingFinished();
}