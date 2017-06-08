/**
 * Created by Daniel on 03.06.2017.
 */


var iota = new IOTA({
    'provider': 'http://5.9.149.169:14265'
});
var depth = 4;
var minWeightMagnitude = 13;

function addChecksum(data){
    return iota.utils.addChecksum(data);
}

function validateSeed(seed){
    return iota.valid.isTrytes(seed);
}

function validateAddress(address){
    return iota.valid.isAddress(address);
}

function categorizeTransactions(transactions, addresses){
    return iota.utils.categorizeTransfers(transactions, addresses);
}

function loadWalletData(callback){
    iota.api.getAccountData(getSeed(), callback);
}

function getMessage(transaction){
    var m = iota.utils.fromTrytes(transaction.signatureMessageFragment.replace('9', ''));
    return '"' + m + '"';
}

function getPendingOut(){
    var outTransactions = categorizeTransactions(walletData.transfers, walletData.addresses).sent;
    var pendingOut = [];
    for (var i = 0; i < outTransactions.length; i++){
        var transfer = outTransactions[i][0];
        if (!transfer.persistence){
            pendingOut.push(transfer);
        }
    }

    return pendingOut;
}

/*
* Finds a list of inputs such that no inputs currently have any pending
* transactions and the total balance across the inputs are >= amount
* If no combination if inputs matches those criteria, an empty list
* is returned, signalling a double spend. If the wallet data is not
* available, null is returned
*/
function findInputs(amount){
    if (!walletData){
        return null;
    }

    var inputs = walletData.inputs;

    var pendingOut = getPendingOut();
    var confirmedAddresses = [];
    var availableAmountInConfirmedAddresses = 0;
    for (var i = 0; i < inputs.length; i++){
        var isAddressInUse = false;
        for (var j = 0; j < pendingOut.length; j++){
            if (pendingOut[j].address !== inputs[i].address){
                isAddressInUse = true;
                break;
            }
        }
        if (!isAddressInUse) {
            availableAmountInConfirmedAddresses += inputs[i].balance;
            confirmedAddresses.push(inputs[i]);
        }
    }

    if (confirmedAddresses.length === 0 || availableAmountInConfirmedAddresses < amount){
        return [];
    }

    return confirmedAddresses;
}

function sendIotas(to_address, amount, message, callback, options={}){
    var transfer = [{
        'address': to_address,
        'value': amount,
        'message': iota.utils.toTrytes(message)
    }];

    iota.api.sendTransfer(getSeed(), depth, minWeightMagnitude, transfer, options, callback);
}

function generateRandomSeed(){
    const seedLength = 81;
    var seed = "";
    const possibleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ9";

    for( var i=0; i < seedLength; i++ ) {
        seed += possibleChars.charAt(Math.floor(Math.random() * possibleChars.length));
    }

    return seed;
}

function encrypt(key, seed){
    return sjcl.encrypt(key, seed);
}

function decrypt(key, data){
    return sjcl.decrypt(key, data);
}

function saveSeed(cvalue) {
    localStorage.setItem("seed", cvalue);
    document.cookie = 'isLoggedIn=;Path=/;';
}

function getSeed() {
    var seed = localStorage.getItem('seed');
    if (seed !== null){
        return seed;
    }

    window.location = '/wallets/login';
    throw('Seed not found');
}

function deleteSeed() {
    document.cookie = 'isLoggedIn=; Path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    localStorage.removeItem('seed');
}

function generateNewAddress(callback){
    iota.api.getNewAddress(getSeed(), callback);
}

function attachAddress(addr, callback){
    sendIotas(addr, 0, 'Attached address', callback);
}

function shouldReplay(address, callback){
    iota.api.shouldYouReplay(address, callback);
}


function replayBundle(tail_hash, callback){
    iota.api.replayBundle(tail_hash, depth, minWeightMagnitude, callback);
}