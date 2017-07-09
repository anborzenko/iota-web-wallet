/**
 * Created by Daniel on 04.06.2017.
 */

function onGetWalletData(e, accountData, progress) {
    if (window.location.href.indexOf('wallets/show') === -1){
        return;
    }
    var spinner = $("#loading");

    if (spinner.is(':visible')){
        spinner.spin(false);
        $(document).find('#loading').hide();
        onFirstLoadFinished();
    }

    if (e){
        document.getElementById('loading').innerHTML = "<div class='alert alert-danger'>Could not load your wallet. Please check the node health. " + e.message + "</div>";
        return;
    }
    addWalletData(accountData);

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
    document.getElementById('send_balance').innerHTML = 'Limit: ' + getSeedBalance() + ' IOTAs';
}

function addPendingToBalance(receiving_address, amount){
    var dom = $('#wallet_balance_pending');

    if (getArrayIndex(window.walletData.addresses, receiving_address, plainComparer) === -1){
        // Outgoing tx
        amount *= -1;
    }

    var summary = document.getElementById("wallet_balance_pending_amount");
    var existingAmount = parseInt(summary.innerHTML);

    if (existingAmount + amount === 0){
        dom.hide();
    }else{
        dom.show();
        summary.innerHTML = existingAmount + amount;
    }
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
    setLastKnownAddressIndex(getLastKnownAddressIndex() + 1);
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
    onTxLoadingFinishedFirstTime();
}

function onFirstLoadFinished(){
    // Pre fill the send form if everything needed is supplied in the url
    if (window.location.href.indexOf('recipient') !== -1){
        openSendWindowAndPrefill();
    }
}

function addWalletData(data) {
    var tToRemove = [];
    var walletTToRemove = [];
    for (var i = 0; i < data.transfers.length; i++) {
        if (!isInArray(window.walletData.transfers, data.transfers[i], transferComparer)) {
            window.walletData.transfers.push(data.transfers[i]);
        } else {
            tToRemove.push(i);
        }
        // Remove transactions that have changed persistence
        if (isInArray(window.walletData.transfers, data.transfers[i], transferChangedPersistenceComparer)) {
            walletTToRemove.push(getArrayIndex(window.walletData.transfers, data.transfers[i], transferChangedPersistenceComparer));
            // Update the pending account balance
            addPendingToBalance(data.transfers[i][0].address, -data.transfers[i][0].value)
        }
    }
    var iToRemove = [];
    for (i = 0; i < data.inputs.length; i++) {
        if (isInArray(window.walletData.inputs, data.inputs[i], addressComparer)){
            window.walletData.inputs[getArrayIndex(window.walletData.inputs, data.inputs[i], addressComparer)] = data.inputs[i];
        } else if (!isInArray(window.walletData.inputs, data.inputs[i], inputComparer)) {
            window.walletData.inputs.push(data.inputs[i]);
        } else {
            iToRemove.push(i);
        }
    }

    // Remove any inputs that are now used in a confirmed send
    var walletIToRemove = [];
    var confirmedOut = getConfirmedOut();
    for (i = 0; i < window.walletData.inputs.length; i++) {
        if (isInArray(confirmedOut, window.walletData.inputs[i], senderInputAddressComparer)){
            walletIToRemove.push(i);
        }
    }

    window.walletData.inputs = removeIndexes(window.walletData.inputs, walletIToRemove);
    window.walletData.transfers = removeIndexes(window.walletData.transfers, walletTToRemove);
    data.transfers = removeIndexes(data.transfers, tToRemove);
    data.inputs = removeIndexes(data.inputs, iToRemove);

    return data;
}
