/**
 * Created by Daniel on 03.06.2017.
 */


function addChecksum(data){
    return iota.utils.addChecksum(data);
}

function validateSeed(seed){
    return iota.valid.isTrytes(seed);
}

function validateAddress(address){
    return iota.valid.isAddress(address);
}

function loadWalletData(callback, onFinishedCallback){
    var lastKnownAddressIndex = getLastKnownAddressIndex();
    var seed = getSeed();

    if (!lastKnownAddressIndex){
        getMostRecentAddressIndex(seed, function (e, end) {
            lastKnownAddressIndex = end+1;
            setLastKnownAddressIndex(lastKnownAddressIndex);
            walletData.latestAddress = generateAddress(seed, lastKnownAddressIndex);
            callback(null, walletData);
            getAccountData(seed, {start: lastKnownAddressIndex > defaultNumAddessesToLoad ? lastKnownAddressIndex - defaultNumAddessesToLoad : 0, end: lastKnownAddressIndex},
                callback, onFinishedCallback);
        });
    }else{
        // Make sure it really is the most recent
        iota.api.getNewAddress(seed, {index: lastKnownAddressIndex, returnAll: true}, function (e, res) {
            setLastKnownAddressIndex(lastKnownAddressIndex + res.length - 1);
            walletData.latestAddress = res[res.length-1];

            getAccountData(seed, {start: lastKnownAddressIndex > defaultNumAddessesToLoad ? lastKnownAddressIndex - defaultNumAddessesToLoad : 0, end: lastKnownAddressIndex},
                callback, onFinishedCallback);
        });
    }
}

function loadWalletDataRange(start, end, callback, onFinishedCallback){
    setTimeout(function(){ getAccountData(getSeed(), {start: start, end: end}, callback, onFinishedCallback); }, 0);
}

function getPendingOut(){
    var outTransactions = categorizeTransactions(walletData.transfers).sent;
    var pendingOut = [];
    for (var i = 0; i < outTransactions.length; i++){
        var transfer = outTransactions[i];
        if (!transfer[0].persistence){
            pendingOut.push(transfer);
        }
    }

    return pendingOut;
}

function getConfirmedOut(){
    var outTransactions = categorizeTransactions(walletData.transfers).sent;
    var confirmedOut = [];
    for (var i = 0; i < outTransactions.length; i++){
        var transfer = outTransactions[i];
        if (transfer[0].persistence){
            confirmedOut.push(transfer);
        }
    }

    return confirmedOut;
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
            if (getSenderAddress(pendingOut[j]).address === inputs[i].address){
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

function sendIotas(to_address, amount, message, callback, status_callback){
    var transfer = [{
        'address': to_address,
        'value': amount,
        'message': iota.utils.toTrytes(message)
    }];
    sendTransferWrapper(getSeed(), depth, minWeightMagnitude, transfer, {'inputs': findInputs()}, callback, status_callback);
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

    return result;
}

function encrypt(key, seed){
    return sjcl.encrypt(key, seed);
}

function decrypt(key, data){
    return sjcl.decrypt(key, data);
}

function saveSeed(cvalue, password) {
    sessionStorage.setItem("unnamed", password);
    sessionStorage.setItem("seed", encrypt(password, cvalue));
    document.cookie = 'isLoggedIn=;Path=/;';
}

function getSeed() {
    var password = sessionStorage.getItem('unnamed');
    var seed = sessionStorage.getItem('seed');
    if (seed !== null){
        return decrypt(password, seed);
    }

    window.location = '/wallets/login';
    throw('Seed not found');
}

function deleteSeed() {
    document.cookie = 'isLoggedIn=; Path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    sessionStorage.removeItem('seed');
    sessionStorage.removeItem('unnamed');
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

function isDoubleSpend(transfer, callback){
    if (transfer[0].persistence){
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

    iota.api.getBalances(addressesOut, 100, function(e, balances){
        var b = sumList(balances.balances);
        var outgoingValues = Math.abs(values);
        return callback(null, b < outgoingValues);
    });
}

function replayBundle(tail_hash, callback){
    iota.api.replayBundle(tail_hash, depth, minWeightMagnitude, callback);
}

function loadNodeInfoCached(callback){
    if (nodeInfo === null){
        loadNodeInfo(callback);
    }else{
        callback(null, nodeInfo);
    }
}

function loadNodeInfo(callback){
    iota.api.getNodeInfo(function (e, res) {
        if (!e) {
            window.nodeInfo = res;
        }
        callback(e, res);
    });
}

function savePendingTransaction(tail_hash){
    try {
        $.ajax({
            type: "GET",
            url: 'add_pending_transaction',
            data: {tail_hash: tail_hash},
            dataType: "JSON",
            success: function(response) {},
            error: function(err) {}
        });
    }catch(err){}
}

// Retrieves a previous transaction and replays it
function getAndReplayPendingTransaction(){
    $.ajax({
        type: "GET",
        url: 'get_next_pending_transaction',
        dataType: "JSON",
        success: function (response) {
            selflessReplay(response.tail_hash);
        },
        error: function(err){}
    });
}

function selflessReplay(tail_hash){
    // First check if the transaction is done, or is a double spend. If so, tell the server to delete it.
    iota.api.getTransactionsObjects([tail_hash], function(e, bundle){
        var tail = bundle[0];
        if (e){
            return notifyServerAboutNonReplayableTransaction(tail_hash);
        }

        shouldReplay(tail.address, function (e, res){
            if (e ||!res){
                // Possibly double spend
                return notifyServerAboutNonReplayableTransaction(tail_hash);
            }

            replayBundle(tail_hash, function(e, res){
                if (e){
                    return notifyServerAboutNonReplayableTransaction(tail_hash);
                }
            });
        })

    })
}

function notifyServerAboutNonReplayableTransaction(tail_hash){
    $.ajax({
        type: "GET",
        url: 'delete_pending_transaction',
        data: {tail_hash: tail_hash},
        dataType: "JSON",
        success: function(response) {
            // Try the next transaction instead.
            getAndReplayPendingTransaction();
        },
        error: function(err){}
    });
}

function getLastKnownAddressIndex(){
    return parseInt(sessionStorage.getItem('lkai'));
}

function setLastKnownAddressIndex(value){
    sessionStorage.setItem('lkai', value);
}