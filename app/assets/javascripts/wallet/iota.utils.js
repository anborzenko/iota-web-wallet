/**
 * Created by Daniel on 13.06.2017.
 */
function getSenderAddress(bundle){
    for (var j = 0; j < bundle.length; j++){
        if (bundle[j].value < 0 || j >= bundle.length - 1){
            return bundle[j].address;
        }
    }
}

function addWalletData(data) {
    var tToRemove = [];
    for (var i = 0; i < data.transfers.length; i++) {
        if (!isInArray(walletData.transfers, data.transfers[i], transferComparer)) {
            walletData.transfers.push(data.transfers[i]);
        } else {
            tToRemove.push(i);
        }
    }
    var iToRemove = [];
    for (i = 0; i < data.inputs.length; i++) {
        if (!isInArray(walletData.inputs, data.inputs[i], inputComparer)) {
            walletData.inputs.push(data.inputs[i]);
        } else {
            iToRemove.push(i);
        }
    }

    // Remove any old inputs that have a confirmed transaction
    var walletIToRemove = [];
    var confirmedOut = getConfirmedOut();
    for (i = 0; i < walletData.inputs.length; i++) {
        if (isInArray(confirmedOut, walletData.inputs[i], senderInputAddressComparer)){
            walletIToRemove.push(i);
        }
    }

    walletData.inputs = removeIndexes(walletData.inputs, walletIToRemove);
    data.transfers = removeIndexes(data.transfers, tToRemove);
    data.inputs = removeIndexes(data.inputs, iToRemove);

    for (i = 0; i < walletData.addresses.length; i++){
        walletData.balances[walletData.addresses[i]] = data.balances[walletData.addresses[i]];
    }
    return data;
}

function getAddressBalance(address){
    for (var i = 0; i < walletData.inputs.length; i++){
        if (walletData.inputs[i].address === address){
            return walletData.inputs[i].balance;
        }
    }
    return 0;
}

function getSeedBalance(){
    var balance = 0;
    for (var i = 0; i < walletData.inputs.length; i++){
        balance += walletData.inputs[i].balance;
    }
    return balance;
}

function generateAddress(seed, i){
    if (!(i in walletData.generatedIndexes)){
        var address = iota.api._newAddress(seed, i, 2, false);
        walletData.addresses.push(address);
        walletData.generatedIndexes[i] = address;
    }

    return walletData.generatedIndexes[i];
}

function getIndexOfAddress(address){
    for (var key in walletData.generatedIndexes){
        if (walletData.generatedIndexes[key] === address){
            return parseInt(key);
        }
    }
}

function getMessage(transaction){
    var m = iota.utils.fromTrytes(transaction.signatureMessageFragment.replace('9', ''));
    return '"' + m + '"';
}

function categorizeTransactions(transactions){
    var res = iota.utils.categorizeTransfers(transactions, walletData.addresses);
    if (res.sent.length + res.received.length === transactions.length) {
        return res;
    }
    // Some transactions could not be classified because we don't have enough addresses.
    // Generate backwards until all are known
    var unknownTx = [];
    for (var i = 0; i < transactions.length; i++){
        if (!isInArray(res.sent, transactions[i], transferComparer) &&
            !isInArray(res.received, transactions[i], transferComparer)){
            unknownTx.push(transactions[i]);
        }
    }

    var seed = getSeed();
    var keys = [];
    for(var k in walletData.generatedIndexes) keys.push(k);
    var minLoaded = findMin(keys);
    for (i = minLoaded - 1; i >= 0 && unknownTx.length > 0; i--){
        generateAddress(seed, i);
        c = iota.utils.categorizeTransfers(unknownTx, walletData.addresses);
        for (var j = c.sent.length - 1; j >= 0; j--){
            res.sent.push(c.sent[j]);
            unknownTx.splice(j, 1);
        }
        for (j = c.received.length - 1; j >= 0; j--){
            res.received.push(c.received[j]);
            unknownTx.splice(j, 1);
        }
    }
    return res;
}