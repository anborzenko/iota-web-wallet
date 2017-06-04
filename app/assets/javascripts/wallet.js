/**
 * Created by Daniel on 03.06.2017.
 */


var iota = new IOTA({
    'provider': 'http://mainnet.necropaz.com:14500'
});

function validateSeed(seed){
    return iota.valid.isTrytes(seed);
}

function loadWalletData(callback){
    var seed = getSeed();
    iota.api.getAccountData(seed, callback);
}

function sendIotas(to_address, amount){

}

function generateAddress(){
    console.log("Generating an address");

    var seed = getSeed();
    iota.api.getNewAddress(seed, {'checksum': true}, function(e,address) {
        if (!e) {
            alert('Address: ' + address);
            console.log("NEW ADDRESS GENERATED: ", address)
        }else{
            alert('Address failed: ' + e);
            console.log("Error generating address: ", e)
        }
    });
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

function cacheSeed(cvalue) {
    document.cookie = 'seed=' + cvalue + ';path=/';
}

function getSeed() {
    const cname = 'seed';
    var name = cname + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }

    // TODO: Force redirect to login and raise an exception
    return "";
}

function deleteSeed() {
    document.cookie = 'seed=;expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}