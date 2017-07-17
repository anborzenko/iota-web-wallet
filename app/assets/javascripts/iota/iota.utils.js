/**
 * Created by Daniel on 13.06.2017.
 */


function getSenderAddresses(bundle){
    var addresses = [];
    for (var j = 0; j < bundle.length; j++){
        if (bundle[j].value < 0 || j >= bundle.length - 1){
            addresses.push(bundle[j].address);
        }
    }

    return addresses;
}

// Returns the seed balance from the cached inputs
function getSeedBalance(){
    var balance = 0;
    for (var i = 0; i < window.walletData.inputs.length; i++){
        balance += window.walletData.inputs[i].balance;
    }
    return balance;
}

// Loads the seed balance without cached values
function loadSeedBalance(callback){
    var balance = 0;

    loadWalletData(function(data){
        for (var i = 0; i < data.inputs.length; i++) {
            balance += data.inputs[i].balance;
        }
    }, function() {
        callback(balance);
    });
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
        var c = window.iota.utils.categorizeTransfers(unknownTx, window.walletData.addresses);
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

function findTxAmount(bundle){
    var amount = 0;
    var tx_ids = [];

    for (var i = 0; i < bundle.length; i++) {
        if (Math.abs(bundle[i].value) > 0 && isInArray(window.walletData.addresses, bundle[i].address, plainComparer)) {
            if (!isInArray(tx_ids, bundle[i].bundle + bundle[i].currentIndex.toString(), plainComparer)){
                amount += bundle[i].value;
                tx_ids.push(bundle[i].bundle + bundle[i].currentIndex.toString());
            }
        }
    }

    return amount;
}