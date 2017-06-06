/**
 * Created by Daniel on 03.06.2017.
 */


var iota = new IOTA({
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
    var m = iota.utils.fromTrytes(transaction.signatureMessageFragment.replace('9', ''));
    return '"' + m + '"';
}

function sendIotas(to_address, amount, message, callback){
    var depth = 4;
    var minWeightMagnitude = 13;

    var transfer = [{
        'address': to_address,
        'value': amount,
        'message': iota.utils.toTrytes(message)
    }];

    iota.api.sendTransfer(getSeed(), depth, minWeightMagnitude, transfer, getInputs(), callback);
}

function getInputs(){
    // TODO: find all addresses that have a positive balance such that the sum of balances >= the amount. Use those as the inputs.
    return {};
}
/*
TODO: Select unit when sending
TODO: Prevent sending more than one transaction at once. Disable button
TODO: If there is a transaction pending that has been sent recently, avoid sending new ones or make sure a different iota is sent
TODO: hide the seed under a password field when you are not copying it or using it.
    TODO: Replay (also under the hood)
TODO: Information and help all around
*/
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
}

function getSeed() {
    var seed = localStorage.getItem('seed');
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