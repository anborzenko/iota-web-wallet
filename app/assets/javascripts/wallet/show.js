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
        onFirstLoadFinished();
    }

    if (e){
        return renderDangerAlert('loading', 'Could not load your wallet. Please check the node health. ');
    }
    addWalletData(accountData);

    $(document).find('#wallet-data').show();

    if (progress) {
        document.getElementById('transactionLoadStatus').innerHTML = (progress ? progress : 0) + '%';
    }

    populateWallet();
    populateTransactions(accountData);
}

function populateWallet(){
    var seedBalance = getSeedBalance();

    $("#seed_box").val(getSeed());
    document.getElementById("wallet_balance_summary").innerHTML = convertIotaValuesToHtml(getSeedBalance());
    document.getElementById("wallet_balance").innerHTML = '<b>' + seedBalance + '</b> IOTAs';
    $('#address_box').val(addChecksum(getNextUnspentAddress()));
    document.getElementById('send_balance').innerHTML = 'Limit: ' + seedBalance + ' IOTAs';
}

function addPendingToBalance(amount){
    var dom = $('#wallet_balance_pending');

    var summary = document.getElementById("wallet_balance_pending_amount");
    var existingAmount = parseInt(summary.innerHTML);
    summary.innerHTML = existingAmount + amount;

    if (existingAmount + amount === 0){
        dom.hide();
    }else{
        dom.show();
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
    setTimeout(function () {
        document.getElementById('seed_box').type = 'password';
    }, 2000);
}

function onGenerateAddressClick(){
    if (!window.walletData){
        return;
    }
    var status = document.getElementById('refresh_address');
    status.onclick = function() {};
    status.innerHTML = 'Attaching. Please wait..';
    attachAddress(getNextUnspentAddress(), onAttachBeforeGenerateAddressCallback);
}

function onAttachBeforeGenerateAddressCallback(e, res){
    if (e){
        resetAddressGenerationInput();
        return renderDangerAlert('wallet_show_notifications', "Failed to generate new address. " + e.message);
    }

    document.getElementById('refresh_address').innerHTML = 'Generating. Please wait..';
    setLastSpentAddressIndex(getLastSpentAddressIndex() + 1);
    generateNewAddress(onGenerateAddressCallback);
}

function onGenerateAddressCallback(e, res){
    resetAddressGenerationInput();

    if (e){
        return renderDangerAlert('wallet_show_notifications', "Failed to generate new address. " + e.message);
    }

    res = addChecksum(res);
    $('#address_box').val(res);
    renderSuccessAlert('wallet_show_notifications', 'A new address was generated');
}

function resetAddressGenerationInput(){
    var status = document.getElementById('refresh_address');
    status.onclick = function() {onGenerateAddressClick()};

    status.innerHTML = 'Generate new address';
    onTxLoadingFinishedFirstTime();
}

function onFirstLoadFinished(){
    $(document).find('#loading').hide();
}

// Responsible for taking all new wallet data, and updating the existing wallet data with the new information.
// It also removes outdated information, such as confirmed txs.
function addWalletData(data) {
    var tToRemove = [];
    var walletTToRemove = [];

    // Update transactions
    for (var i = 0; i < data.transfers.length; i++) {
        if (!isInArray(window.walletData.transfers, data.transfers[i], transferComparer)) {
            window.walletData.transfers.push(data.transfers[i]);
        } else {
            tToRemove.push(i);
        }

        // Remove transactions that have changed persistence
        var index = getArrayIndex(window.walletData.transfers, data.transfers[i], transferChangedPersistenceComparer);
        if (index !== -1) {
            walletTToRemove.push(index);
            // Update the pending account balance
            addPendingToBalance(-findTxAmount(data.transfers[i]));
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

    // Update inputs
    for (i = 0; i < data.inputs.length; i++) {
        if (isInArray(window.walletData.inputs, data.inputs[i], addressComparer)){
            // Update existing input
            window.walletData.inputs[getArrayIndex(window.walletData.inputs, data.inputs[i], addressComparer)] = data.inputs[i];
        } else if (!isInArray(window.walletData.inputs, data.inputs[i], inputComparer)) {
            // Add new input (address with balance not existing)
            window.walletData.inputs.push(data.inputs[i]);
        }
    }

    window.walletData.transfers = removeIndexes(window.walletData.transfers, walletTToRemove);
    data.transfers = removeIndexes(data.transfers, tToRemove);

    return data;
}
