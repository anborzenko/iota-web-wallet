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
    var walletTToRemove = [];
    for (var i = 0; i < data.transfers.length; i++) {
        if (!isInArray(window.walletData.transfers, data.transfers[i], transferComparer)) {
            window.walletData.transfers.push(data.transfers[i]);
        } else {
            tToRemove.push(i);
        }
        // Remove transactions that have changed persistence from walletData
        if (isInArray(window.walletData.transfers, data.transfers[i], transferChangedPersistenceComparer)) {
            walletTToRemove.push(getArrayIndex(window.walletData.transfers, data.transfers[i], transferChangedPersistenceComparer));
        }
    }
    var iToRemove = [];
    for (i = 0; i < data.inputs.length; i++) {
        if (isInArray(window.walletData.inputs, data.inputs[i], inputAddressComparer)){
            window.walletData.inputs[getArrayIndex(window.walletData.inputs, data.inputs[i], inputAddressComparer)] = data.inputs[i];
        } else if (!isInArray(window.walletData.inputs, data.inputs[i], inputComparer)) {
            window.walletData.inputs.push(data.inputs[i]);
        } else {
            iToRemove.push(i);
        }
    }

    // Remove any old inputs that have a confirmed transaction
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

function getAddressBalance(address){
    for (var i = 0; i < window.walletData.inputs.length; i++){
        if (window.walletData.inputs[i].address === address){
            return window.walletData.inputs[i].balance;
        }
    }
    return 0;
}

function getSeedBalance(){
    var balance = 0;
    for (var i = 0; i < window.walletData.inputs.length; i++){
        balance += window.walletData.inputs[i].balance;
    }
    return balance;
}

function generateAddress(seed, index){
    // First see if anything is cached.
    var cacheKey = 'rai' + getStringHash(getEncryptedSeed());

    var rawAddressIndexes = localStorage.getItem(cacheKey);
    if (!dictHasKeys(window.walletData.generatedIndexes) && rawAddressIndexes) {
        window.walletData.generatedIndexes = dictFromString(rawAddressIndexes);
        window.walletData.addresses = getDictValues(window.walletData.generatedIndexes);
    }

    if (!(index in window.walletData.generatedIndexes)) {
        var address = window.iota.api._newAddress(seed, index, 2, false);
        window.walletData.addresses.push(address);
        window.walletData.generatedIndexes[index] = address;

        localStorage.setItem(cacheKey, dictToString(window.walletData.generatedIndexes));
    }

    return window.walletData.generatedIndexes[index];
}

function getIndexOfAddress(address){
    for (var key in window.walletData.generatedIndexes){
        if (window.walletData.generatedIndexes[key] === address){
            return parseInt(key);
        }
    }
}

function getMessage(transaction){
    var m = window.iota.utils.fromTrytes(transaction.signatureMessageFragment.replace('9', ''));
    return '"' + m + '"';
}

function categorizeTransactions(transactions){
    var res = window.iota.utils.categorizeTransfers(transactions, window.walletData.addresses);
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
    var minLoaded = getLastKnownAddressIndex();
    for (i = minLoaded - 1; i >= 0 && unknownTx.length > 0; i--){
        generateAddress(seed, i);
        c = window.iota.utils.categorizeTransfers(unknownTx, window.walletData.addresses);
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

function getPersistence(bundle){
    for (var i = 0; i < bundle.length; i++){
        if (bundle[i].persistence){
            return true;
        }
    }
    return false;
}

function convertToIotas(value, unit){
    return value * Math.pow(1000, window.units.indexOf(unit));
}