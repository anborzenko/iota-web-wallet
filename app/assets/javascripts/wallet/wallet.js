/**
 * Created by Daniel on 03.06.2017.
 */


function addChecksum(data){
    return window.iota.utils.addChecksum(data);
}

function removeChecksum(data){
    return window.iota.utils.noChecksum(data);
}

function validateSeed(seed){
    return window.iota.valid.isTrytes(seed);
}

function validateAddress(address){
    return window.iota.valid.isAddress(address);
}

function loadWalletData(liveCallback, onFinishedCallback){
    generateNewAddress(function(e, res){
        if (e){
            return onFinishedCallback(e);
        }

        var lastKnownAddressIndex = getLastSpentAddressIndex();
        getAccountData(getSeed(), {start: lastKnownAddressIndex - window.defaultNumAddessesToLoad,
            end: lastKnownAddressIndex}, liveCallback, onFinishedCallback);
    });
}

function loadWalletDataRange(start, end, callback, onFinishedCallback){
    setTimeout(function(){ getAccountData(getSeed(), {start: start, end: end}, callback, onFinishedCallback); }, 50);
}

function getPendingOut(){
    var outTransactions = categorizeTransactions(window.walletData.transfers).sent;
    var pendingOut = [];
    for (var i = 0; i < outTransactions.length; i++){
        var transfer = outTransactions[i];
        if (!getPersistence(transfer)){
            pendingOut.push(transfer);
        }
    }

    return pendingOut;
}

function getConfirmedOut(){
    var outTransactions = categorizeTransactions(window.walletData.transfers).sent;
    var confirmedOut = [];
    for (var i = 0; i < outTransactions.length; i++){
        var transfer = outTransactions[i];
        if (getPersistence(transfer)){
            confirmedOut.push(transfer);
        }
    }

    return confirmedOut;
}

/*
* Finds a list of inputs such that no inputs currently have any pending
* transactions and the total balance across the inputs are >= amount.
* If no combination if inputs matches those criteria, an empty list
* is returned, signalling a double spend. If the wallet data is not
* available, null is returned
*/
function findInputs(amount){
    if (!window.walletData){
        return null;
    }

    var inputs = window.walletData.inputs.sort(function(a, b) { return a.balance - b.balance});

    var pendingOut = getPendingOut();
    var confirmedAddresses = [];
    var availableAmountInConfirmedAddresses = 0;
    for (var i = 0; i < inputs.length; i++){
        var isAddressInUse = false;
        for (var j = 0; j < pendingOut.length; j++){
            if (isInArray(getSenderAddresses(pendingOut[j]), inputs[i], addressComparer)){//
                isAddressInUse = true;
                break;
            }
        }
        if (!isAddressInUse) {
            availableAmountInConfirmedAddresses += inputs[i].balance;
            confirmedAddresses.push(inputs[i]);
            if (availableAmountInConfirmedAddresses >= amount){
                break;
            }
        }
    }

    if (confirmedAddresses.length === 0 || availableAmountInConfirmedAddresses < amount){
        return [];
    }

    return confirmedAddresses;
}

function sendIotas(to_address, amount, message, callback, status_callback){
    var transfer = [{
        'address': to_address,
        'value': amount,
        'message': window.iota.utils.toTrytes(message)
    }];
    sendTransferWrapper(getSeed(), transfer, {'inputs': findInputs(amount)}, callback, status_callback);
}

function generateRandomSeed(){
    const seedLength = 81;
    var charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ9";
    var i;
    var result = "";
    if (window.crypto && window.crypto.getRandomValues) {
        var values = new Uint32Array(seedLength);
        window.crypto.getRandomValues(values);
        for (i = 0; i < seedLength; i++) {
            result += charset[values[i] % charset.length];
        }
        return result;
    } else {
        throw("Your browser do not support secure seed generation. Try upgrading your browser");
    }
}

function encrypt(key, seed){
    return sjcl.encrypt(key, seed);
}

function decrypt(key, data){
    return sjcl.decrypt(key, data);
}

function generateNewAddress(callback){
    var seed = getSeed();
    var lastSpentAddressIndex = getLastSpentAddressIndex();

    if (!lastSpentAddressIndex){
        findLastSpentAddressIndex(seed, function (e, end) {
            if (e){
                return callback(e);
            }

            setLastSpentAddressIndex(end);
            callback(null, getNextUnspentAddress());
        });
    }else{
        // Make sure it really is the most recent
        window.iota.api.getNewAddress(seed, {index: lastSpentAddressIndex+1, returnAll: true}, function (e, res) {
            if (e){
                return callback(e);
            }

            setLastSpentAddressIndex(lastSpentAddressIndex + res.length - 1);
            callback(null, getNextUnspentAddress());
        });
    }
}

function attachAddress(addr, callback){
    sendIotas(addr, 0, 'Attached address', callback);
}

function isDoubleSpend(transfer, callback){
    if (getPersistence(transfer)){
        return callback(null, false);
    }

    var addressesOut = [];
    var values = 0;

    for (var i = 0; i < transfer.length; i++){
        if (transfer[i].value < 0){
            addressesOut.push(transfer[i].address);
            values += transfer[i].value;
        }
    }

    if (values === 0){// Not a value transfer
        callback(null, false);
    }

    window.iota.api.getBalances(addressesOut, 100, function(e, balances){
        var b = sumList(balances.balances);
        var outgoingValues = Math.abs(values);
        return callback(null, b < outgoingValues);
    });
}

function getLastSpentAddressIndex(){
    var seed = getEncryptedSeed();
    if (seed !== null){
        return parseInt(localStorage.getItem('lkai' + getStringHash(seed)));
    }

    return null;
}

function setLastSpentAddressIndex(value){
    // Use the encrypted seed as key
    var seed = getEncryptedSeed();
    if (seed !== null){
        localStorage.setItem('lkai' + getStringHash(seed), value);
    }
}

function getNextUnspentAddress(){
    return generateAddress(getSeed(), getLastSpentAddressIndex() + 1);
}

// Uploads a list of num unspent addresses to the server. This is executed async
function uploadUnspentAddresses(num){
    var username = getUsername();
    if (!username || username.length === 0){
        return;//Logged in using a seed
    }
    if (sessionStorage.getItem('haveUploadedUnspentAddresses') === 'true'){
        return;
    }

    setTimeout(function(){
        var lastKnownAddressIndex = getLastSpentAddressIndex();
        var seed = getSeed();
        var addresses = [];
        for (var i = lastKnownAddressIndex; i < lastKnownAddressIndex + num; i++) {
            addresses.push(generateAddress(seed, i));
        }

        $.ajax({
            type: "POST",
            url: 'add_addresses',
            data: { 'addresses': addresses },
            dataType: "JSON",
            success: function (response) {
                sessionStorage.setItem('haveUploadedUnspentAddresses', true);
            }
        });
    }, 50);
}