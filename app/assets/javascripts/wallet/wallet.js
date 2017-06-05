/**
 * Created by Daniel on 03.06.2017.
 */


let iota = new IOTA({
    'provider': 'http://mainnet.necropaz.com:14500'
});

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
    let m = iota.utils.fromTrytes(transaction.signatureMessageFragment.replace('9', ''));
    return '"' + m + '"';
}

function sendIotas(to_address, amount, message, callback){
    let transfer = [{
        'address': to_address,
        'value': amount,
        'message': iota.utils.toTrytes(message)
    }];

    let depth = 4;
    let minWeightMagnitude = 13;
    iota.api.sendTransfer(getSeed(), depth, minWeightMagnitude, transfer, callback);
}

function generateRandomSeed(){
    const seedLength = 81;
    let seed = "";
    const possibleChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ9";

    for( let i=0; i < seedLength; i++ ) {
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
}

function getSeed() {
    let seed = localStorage.getItem('seed');
    if (seed !== null){
        return seed;
    }

    window.location = '/wallets/login';
    throw('Seed not found');
}

function isLoggedIn(){
    return (localStorage.getItem('seed') !== null);
}

function deleteSeed() {
    localStorage.removeItem('seed');
}