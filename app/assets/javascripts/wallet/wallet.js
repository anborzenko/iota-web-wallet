/**
 * Created by Daniel on 03.06.2017.
 */


var iota = new IOTA({
    'provider': 'http://iotatoken.nl:14265'
});
var depth = 4;
var minWeightMagnitude = 15;

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
            if (pendingOut[j].address === inputs[i].address){
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

    options['inputs'] = walletData.inputs; // TODO: Find

    sendTransferWrapper(iota, getSeed(), depth, minWeightMagnitude, transfer, options, function(e, res){
        onSendIotasCallback(e, res, callback);
    });
}

function onSendIotasCallback(e, res, callback){// TODO: No need for this after debugging
    callback(e, res);
    // TODO: Test if this sends the tail
    savePendingTransaction(res[0]);
    doSelflessDeed();
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
    } else
        throw new Error(
            "Your browser do not support secure seed generation. Try upgrading your browser"
        );

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

function replayBundle(tail_hash, callback){
    iota.api.replayBundle(tail_hash, depth, minWeightMagnitude, callback);
}

var nodeInfo = null;
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
            nodeInfo = res;
        }
        callback(e, res);
    });
}

function savePendingTransaction(tail_hash){
    $.ajax({
        type: "GET",
        url: 'pending_transactions/add',
        data: {tail_hash: tail_hash},
        dataType: "JSON",
    });
}

// Retrieves a previous transaction and replays it
function doSelflessDeed(){
    $.ajax({
        type: "GET",
        url: 'pending_transactions/get_next',
        dataType: "JSON",
        success: function (response) {
            if (response.success){
                try{
                    selflessReplay(response.tail_hash, response.key);
                }catch(err){}
            }
        },
    });
}

function selflessReplay(tail_hash, key){
    // First check if the transaction is done, or is a double spend. If so, tell the server to delete it.
    iota.api.getBundle(tail_hash, function(e, bundle){
        var tail = bundle[0];
        if (tail.persistence){
            // Done
            return notifyServerAboutNonReplayableTransaction(tail_hash, key);
        }

        shouldReplay(tail.address, function (e, res){
            if (!e && !res){
                // Double spend
                return notifyServerAboutNonReplayableTransaction(tail_hash, key);
            }

            replayBundle(tail_hash, function(e, res){});
        })

    })
}

function notifyServerAboutNonReplayableTransaction(tail_hash, key){
    $.ajax({
        type: "GET",
        url: 'pending_transactions/delete',
        data: {key: key},
        dataType: "JSON",
    });
}