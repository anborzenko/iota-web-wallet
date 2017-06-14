/**
 * Created by Daniel on 08.06.2017.
 */

function sendTransferWrapper(seed, depth, minWeightMagnitude, transfer, options, callback, status_callback){
    try{
        status_callback(0, "Preparing transfers");
    }catch(err){}

    iota.api.prepareTransfers(seed, transfer, options, function(error, trytes) {

        if (error) {
            return callback(error)
        }

        sendTrytesWrapper(trytes, depth, minWeightMagnitude, callback, status_callback);
    })
}

function sendTrytesWrapper(trytes, depth, minWeightMagnitude, callback, status_callback){
    try{
        status_callback(0, "Finding transactions to approve");
    }catch(err){}

    iota.api.getTransactionsToApprove(depth, function(error, toApprove) {
        if (error) {
            return callback(error)
        }

        attachToTangle(toApprove.trunkTransaction, toApprove.branchTransaction, minWeightMagnitude, trytes, status_callback, function(error, attached) {
            if (error) {
                return callback(error)
            }

            iota.api.broadcastAndStore(attached, function(error, success) {
                if (error) {
                    return callback(error);
                }

                var finalTxs = [];

                attached.forEach(function(trytes) {
                    finalTxs.push(iota.utils.transactionObject(trytes));
                });

                return callback(null, finalTxs);
            })
        })
    })
}

function attachToTangle(trunkTransaction, branchTransaction, minWeightMagnitude, trytes_in, status_callback, callback){
    try {
        branchTransaction = trits(branchTransaction);
        trunkTransaction = trits(trunkTransaction);
    }catch (err){
        callback(err, null);
    }

    var prevTransaction = null;
    var rec_pow = function (res, i) {
        try{
            status_callback(i / trytes_in.length, "Doing proof of work: " + i + " of " + trytes_in.length + " are complete");
        }catch(err){}

        try {
            if (i >= trytes_in.length) {
                return callback(null, res.reverse());
            }

            var transactionTrits = trits(trytes_in[i]);
            arrayCopy(prevTransaction === null ? trunkTransaction : prevTransaction, 0, transactionTrits, TRUNK_TRANSACTION_TRINARY_OFFSET, TRUNK_TRANSACTION_TRINARY_SIZE);
            arrayCopy(prevTransaction === null ? branchTransaction : trunkTransaction, 0, transactionTrits, BRANCH_TRANSACTION_TRINARY_OFFSET, BRANCH_TRANSACTION_TRINARY_SIZE);

            var transactionTrytes = trytes(transactionTrits);

            curl.pow(transactionTrytes, minWeightMagnitude
            ).then(function (hash) {
                prevTransaction = trits(iota.utils.transactionObject(hash).hash);
                res.push(hash);
                return rec_pow(res, i + 1);
            }).catch(function (err) {
                callback(err, null);
            });
        }catch(err){
            callback(err, null);
        }
    };

    rec_pow([], 0);
}

function getAccountData (seed, options, liveCallback, onFinishedCallback) {
    try{
        // Stop timeouts if any
        clearTimeout(window.walletDataLoader);
    }catch(err){}

    var end = options.end || null;
    var security = options.security || 2;

    var addressesToLoad = new Array(end - options.start);
    for (var i = options.start; i < end; i++) {
        var address = generateAddress(seed, i);
        addressesToLoad[i - options.start] = address;
    }
    addressesToLoad.reverse();

    var bulkSize = 3;
    var loader = function (start, end) {
        var valuesToReturn = {
            'transfers': [],
            'inputs': [],
            'balances': {}
        };

        var addresses = addressesToLoad.slice(options.end - end, options.end - start);
        iota.api._bundlesFromAddresses(addresses, true, function (error, bundles) {
            if (error) return onFinishedCallback(error);

            for (i = 0; i < bundles.length; i++) {
                valuesToReturn.transfers.push(bundles[i]);
            }

            iota.api.getBalances(addresses, 100, function (error, balances) {
                balances.balances.forEach(function (balance, index) {
                    balance = parseInt(balance);
                    valuesToReturn.balances[addresses[index]] = balance;

                    if (balance > 0) {
                        var newInput = {
                            'address': addresses[index],
                            'keyIndex': getIndexOfAddress(addresses[index]),
                            'security': security,
                            'balance': balance
                        };
                        valuesToReturn.inputs.push(newInput);
                    }
                });
                try {
                    var progress = 100 * (options.end - start) / (options.end - options.start);
                    liveCallback(null, valuesToReturn, progress >= 100 ? 99 : Math.floor(progress));
                } catch (err) {
                    // Happens when a new address is generated or iotas are transferred during the update
                    return onFinishedCallback()
                }
                if (end >= options.start) {
                    loader(start - bulkSize, end - bulkSize);
                } else {
                    onFinishedCallback();
                }
            });
        });
    };

    loader(end - bulkSize, end);
}

function getMostRecentAddressIndex(seed, callback){
    var getLastAddressIndex = function(min_nohit, index){
        index = Math.floor(index);
        var address = generateAddress(seed, index);
        iota.api.findTransactions({addresses: [address]}, function (err, transactions) {
            if (err) return callback(err);
            try {
                if (transactions.length !== 0 && min_nohit === index + 1 || index < 0) {
                    return callback(null, index < 0 ? 0 : index);
                }

                if (transactions.length > 0) {
                    if (index >= min_nohit) {
                        return getLastAddressIndex(index * 2, index * 2);
                    } else {
                        return getLastAddressIndex(min_nohit, (min_nohit + index) / 2);
                    }
                } else {
                    if (index === min_nohit){
                        return getLastAddressIndex(min_nohit, index / 2);
                    }else if (index <= min_nohit) {
                        return getLastAddressIndex(index, index - (min_nohit - index) / 2);
                    } else {
                        return getLastAddressIndex(min_nohit, (index + min_nohit) / 2);
                    }
                }
            }catch(err){
                return callback(err);
            }
        });
    };

    var start = 100;
    getLastAddressIndex(start, start);// TODO: If no addresses
}
