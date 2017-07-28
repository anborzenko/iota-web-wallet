/**
 * Created by Daniel on 08.06.2017.
 */

function sendTransferWrapper(seed, transfer, options, callback, status_callback){
    try{
        status_callback(0, "Preparing transfers");
    }catch(err){}

    if (!options['address']){
        options['address'] = getNextUnspentAddress();
    }

    window.iota.api.prepareTransfers(seed, transfer, options, function(error, trytes) {

        if (error) {
            return callback(error)
        }

        sendTrytesWrapper(trytes, callback, status_callback);
    })
}

function sendTrytesWrapper(trytes, callback, status_callback){
    try{
        status_callback(0, "Finding transactions to approve");
    }catch(err){}

    window.iota.api.getTransactionsToApprove(window.depth, function(error, toApprove) {
        if (error) {
            return callback(error)
        }

        // Start doing the pow both remotely and locally. The remote server have every right to reject it
        // if it is too busy. If so, the local pow will just carry on. If not they race to finish
        var ws = startRemotePowWorker(toApprove.trunkTransaction, toApprove.branchTransaction, trytes);

        window.powIsDone = false;
        startRemoteAttachToTangleListener(ws, trytes.length, status_callback, function(error, attached){
            if (error || window.powIsDone) {
                // Only the local pow is considered critical
                return;
            }

            finalizeTransfer(ws, attached, callback);
        });

        attachToTangleLocal(toApprove.trunkTransaction, toApprove.branchTransaction, trytes, status_callback,
            function(error, attached){
                if (window.powIsDone) {
                    return;
                }

                if (error) {
                    return callback(error);
                }

                finalizeTransfer(ws, attached, callback);
            });
    })
}

function startRemotePowWorker(trunkTransaction, branchTransaction, trytes){
    var ws = new WebSocket('ws://localhost:8765/pow');

    ws.onopen = function(){
        ws.send(JSON.stringify({
            'trunk': trunkTransaction,
            'branch': branchTransaction,
            'tx_trytes': trytes,
            'type': 'POW'
        }));
    };

    ws.onclose = function(event){
        console.log('Closed: ' + event.reason);
    };

    return ws;
}

function finalizeTransfer(ws, attached, callback){
    window.powIsDone = true;

    iota.api.storeAndBroadcast(attached, function(error, success) {
        if (error) {
            ws.close();
            return callback(error);
        }

        var finalTxs = [];

        attached.forEach(function(trytes) {
            finalTxs.push(window.iota.utils.transactionObject(trytes));
        });

        // Let the server survey the bundle, and replay it as needed, unless it is a address generation
        if (attached.length > 1) {
            ws.send(JSON.stringify({
                'type': 'survey_bundle',
                'bundle_hash': finalTxs[0].bundle
            }));
        }

        return callback(null, finalTxs);
    });
}

function startRemoteAttachToTangleListener(ws, count, status_callback, callback){
    var attached = [];

    ws.onmessage = function(event){
        if (window.powIsDone){
            return;
        }

        var message = JSON.parse(event.data);

        attached.push(message['trytes']);

        try{
            status_callback(attached.length / count,
                "Doing proof of work: " + attached.length + " of " + count + " are complete");
        }catch(err){}

        if (attached.length === count){
            callback(null, attached.reverse());
        }
    };
}

function attachToTangleLocal(trunkTransaction, branchTransaction, trytes_in, status_callback, callback){
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
            if (i >= trytes_in.length || window.powIsDone) {
                return callback(null, res.reverse());
            }

            var transactionTrits = trits(trytes_in[i]);
            arrayCopy(prevTransaction === null ? trunkTransaction : prevTransaction, 0, transactionTrits,
                window.TRUNK_TRANSACTION_TRINARY_OFFSET, window.TRUNK_TRANSACTION_TRINARY_SIZE);
            arrayCopy(prevTransaction === null ? branchTransaction : trunkTransaction, 0, transactionTrits,
                window.BRANCH_TRANSACTION_TRINARY_OFFSET, window.BRANCH_TRANSACTION_TRINARY_SIZE);

            var transactionTrytes = trytes(transactionTrits);

            curl.pow(transactionTrytes, window.minWeightMagnitude
            ).then(function (hash) {
                prevTransaction = trits(window.iota.utils.transactionObject(hash).hash);
                res.push(hash);
                return rec_pow(res, i + 1);
            }).catch(function (err) {
                return callback(err);
            });
        }catch(err){
            callback(err);
        }
    };

    rec_pow([], 0);
}

function getAccountData (seed, options, liveCallback, onFinishedCallback) {
    options.start = Math.max(options.start, 0);
    options.end = Math.max(options.end, 0);

    var end = options.end || null;
    var security = options.security || 2;
    var bulkSize = 5;

    var loader = function (start, end) {
        start = Math.max(start, 0);
        end = Math.max(end, 0);

        var valuesToReturn = {
            'transfers': [],
            'inputs': []
        };

        var userAddresses = [];
        for (var i = 0; i <= end - start; i++) {
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
                    return onFinishedCallback();
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

function findLastSpentAddressIndex(seed, callback){
    var getLastAddressIndex = function(min_nohit, index){
        index = Math.floor(index);
        var address = generateAddress(seed, index);
        window.iota.api.findTransactions({addresses: [address]}, function (err, transactions) {
            if (err) return callback(err);
            try {
                if (transactions.length !== 0 && min_nohit === index + 1 || index === 0) {
                    return callback(null, index === 0 && transactions.length === 0 ? -1 : index);
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
                    } else {
                        return getLastAddressIndex(index, index / 2);
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
    window.iota.api.findTransactionObjects({'addresses': addresses}, function(error, transactionObjects) {

        if (error) return callback(error);

        // set of bundles
        var bundleHashes = new Set();

        transactionObjects.forEach(function(thisTransaction) {
            bundleHashes.add(thisTransaction.bundle)
        });

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

function replayBundleWrapper(tailHash, callback, status_callback){
    if (!iota.valid.isHash(tailHash)) {
        return callback('Invalid tail');
    }

    iota.api.getBundle(tailHash, function(error, bundle) {

        if (error) return callback(error);

        var bundleTrytes = [];

        bundle.forEach(function(bundleTx) {
            bundleTrytes.push(iota.utils.transactionTrytes(bundleTx));
        });

        return sendTrytesWrapper(bundleTrytes.reverse(), callback, status_callback);
    })
}