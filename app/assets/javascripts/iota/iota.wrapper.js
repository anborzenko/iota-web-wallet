/**
 * Created by Daniel on 08.06.2017.
 */

function sendTransferWrapper(seed, transfer, options, callback, status_callback){
    try{
        status_callback(0, "Preparing transfers");
    }catch(err){}

    window.iota.api.prepareTransfers(seed, transfer, options, function(error, trytes) {

        if (error) {
            return callback(error)
        }

        sendTrytesWrapper(trytes, window.depth, window.minWeightMagnitude, callback, status_callback);
    })
}

function sendTrytesWrapper(trytes, depth, minWeightMagnitude, callback, status_callback){
    try{
        status_callback(0, "Finding transactions to approve");
    }catch(err){}

    window.iota.api.getTransactionsToApprove(window.depth, function(error, toApprove) {
        if (error) {
            return callback(error)
        }
/*
        $.ajax({
            type: "GET",
            url: 'http://127.0.0.1:5000/attach_to_tangle',
            data: {
                'trunk': toApprove.trunkTransaction,
                'branch': toApprove.branchTransaction,
                'min_weight_magnitude': minWeightMagnitude,
                'tx_trytes': trytes.join(',')
            },
            dataType: "JSON",
            success: function(response) {
                var attached = response.result.split(',');
                iota.api.storeAndBroadcast(attached, function(error, success) {
                    if (error) {
                        return callback(error);
                    }

                    var finalTxs = [];

                    attached.forEach(function(trytes) {
                        finalTxs.push(window.iota.utils.transactionObject(trytes));
                    });

                    return callback(null, finalTxs);
                })
            },
            error: function(err) {
                alert(err.message);
            }
        });
*/
        attachToTangle(toApprove.trunkTransaction, toApprove.branchTransaction, minWeightMagnitude, trytes, status_callback, function(error, attached) {
            if (error) {
                return callback(error)
            }

            iota.api.storeAndBroadcast(attached, function(error, success) {
                if (error) {
                    return callback(error);
                }

                var finalTxs = [];

                attached.forEach(function(trytes) {
                    finalTxs.push(window.iota.utils.transactionObject(trytes));
                });

                return callback(null, finalTxs);
            })
        })
    })
}

function attachToTangle(trunkTransaction, branchTransaction, minWeightMagnitude, trytes_in, status_callback, callback){
    try{curl}catch(err){
        return callback({message: 'Your browser do not support webgl2'}, null);
    }

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
            arrayCopy(prevTransaction === null ? trunkTransaction : prevTransaction, 0, transactionTrits, window.TRUNK_TRANSACTION_TRINARY_OFFSET, window.TRUNK_TRANSACTION_TRINARY_SIZE);
            arrayCopy(prevTransaction === null ? branchTransaction : trunkTransaction, 0, transactionTrits, window.BRANCH_TRANSACTION_TRINARY_OFFSET, window.BRANCH_TRANSACTION_TRINARY_SIZE);

            var transactionTrytes = trytes(transactionTrits);

            curl.pow(transactionTrytes, minWeightMagnitude
            ).then(function (hash) {
                prevTransaction = trits(window.iota.utils.transactionObject(hash).hash);
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
    if (options.start < 0){
        options.start = 0;
    }
    if (options.end < 0){
        options.end = 0;
    }

    var end = options.end || null;
    var security = options.security || 2;
    var bulkSize = 5;

    var loader = function (start, end) {
        var valuesToReturn = {
            'transfers': [],
            'inputs': []
        };

        var userAddresses = [];
        for (var i = 0; i < end - start; i++) {
            userAddresses.push(generateAddress(seed, end - i));
        }

        bundlesFromAddresses(userAddresses, function (error, bundles) {
            if (error) return onFinishedCallback(error);

            for (i = 0; i < bundles.length; i++) {
                valuesToReturn.transfers.push(bundles[i]);
            }

            window.iota.api.getBalances(userAddresses, 100, function (error, balances) {
                if (error) return onFinishedCallback(error);

                balances.balances.forEach(function (balance, index) {
                    balance = parseInt(balance);

                    if (balance > 0) {
                        var newInput = {
                            'address': userAddresses[index],
                            'keyIndex': getIndexOfAddress(userAddresses[index]),
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
                if (end > options.start) {
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
        window.iota.api.findTransactions({addresses: [address]}, function (err, transactions) {
            if (err) return callback(err);
            try {
                if (transactions.length !== 0 && min_nohit === index + 1 || index < 0) {
                    return callback(null, index < 0 ? -1 : index);
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
    getLastAddressIndex(start, start);
}


function bundlesFromAddresses (addresses, callback) {
    // call wrapper function to get txs associated with addresses
    window.iota.api.findTransactionObjects({'addresses': addresses}, function(error, transactionObjects) {

        if (error) return callback(error);

        // set of tail transactions
        var bundleHashes = new Set();

        transactionObjects.forEach(function(thisTransaction) {
            bundleHashes.add(thisTransaction.bundle)
        });

        // Get tail transactions for each nonTail via the bundle hash
        window.iota.api.findTransactionObjects({'bundles': Array.from(bundleHashes)}, function(error, bundleObjects) {
            if (error) return callback(error);

            var tailTxArray = [];
            for (var i = 0; i < bundleObjects.length; i++){
                tailTxArray.push(bundleObjects[i].hash);
            }

            window.iota.api.getLatestInclusion(tailTxArray, function(error, states) {
                if (error) return callback(error);

                for (i = 0; i < states.length; i++){
                    bundleObjects[i].persistence = states[i];
                }

                var bundles = mergeCommon(bundleObjects, txInSameBundleComparer);
                for (i = 0; i < bundles.length; i++){
                    bundles[i].sort(sortTx);
                    bundles[i][0].numReplays = count(bundles[i][0], bundles[i], function (a, b) {
                        return a.currentIndex === b.currentIndex
                    });
                }

                callback(null, bundles);
            });
        })
    })
}

function replayBundleWrapper(tailHash, callback){
    if (!iota.valid.isHash(tailHash)) {

        return callback('Invalid tail');
    }

    iota.api.getBundle(tailHash, function(error, bundle) {

        if (error) return callback(error);

        var bundleTrytes = [];

        bundle.forEach(function(bundleTx) {
            bundleTrytes.push(iota.utils.transactionTrytes(bundleTx));
        });

        return sendTrytesWrapper(bundleTrytes.reverse(), window.depth, window.minWeightMagnitude, callback);
    })
}