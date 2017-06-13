/**
 * Created by Daniel on 08.06.2017.
 */

function sendTransferWrapper(iota_inst, seed, depth, minWeightMagnitude, transfer, options, callback, status_callback){
    try{
        status_callback(0, "Preparing transfers");
    }catch(err){}

    iota_inst.api.prepareTransfers(seed, transfer, options, function(error, trytes) {

        if (error) {
            return callback(error)
        }

        sendTrytesWrapper(iota_inst, trytes, depth, minWeightMagnitude, callback, status_callback);
    })
}

function sendTrytesWrapper(iota_inst, trytes, depth, minWeightMagnitude, callback, status_callback){
    try{
        status_callback(0, "Finding transactions to approve");
    }catch(err){}

    iota_inst.api.getTransactionsToApprove(depth, function(error, toApprove) {
        if (error) {
            return callback(error)
        }

        attachToTangle(toApprove.trunkTransaction, toApprove.branchTransaction, minWeightMagnitude, trytes, status_callback, function(error, attached) {
            if (error) {
                return callback(error)
            }

            iota_inst.api.broadcastAndStore(attached, function(error, success) {
                if (error) {
                    return callback(error);
                }

                var finalTxs = [];

                attached.forEach(function(trytes) {
                    finalTxs.push(iota_inst.utils.transactionObject(trytes));
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

var getAccountData = function(seed, options, callback) {
    var end = options.end || null;
    var security = options.security || 2;

    var step = 3;
    var loader = function(start, end) {
        var valuesToReturn = {
            'addresses'         : [],
            'transfers'         : [],
            'inputs'            : [],
            'balances'          : {}
        };

        for (var i = start; i < end; i++) {
            var address = iota.api._newAddress(seed, i, security, false);
            valuesToReturn.addresses.push(address);
        }

        iota.api._bundlesFromAddresses(valuesToReturn.addresses, true, function (error, bundles) {
            if (error) return callback(error);

            for (i = 0; i < bundles.length; i++) {
                valuesToReturn.transfers.push(bundles[i]);
            }

            iota.api.getBalances(valuesToReturn.addresses, 100, function (error, balances) {
                balances.balances.forEach(function (balance, index) {
                    balance = parseInt(balance);
                    valuesToReturn.balances[valuesToReturn.addresses[index]] = balance;

                    if (balance > 0) {
                        var newInput = {
                            'address': valuesToReturn.addresses[index],
                            'keyIndex': index,
                            'security': security,
                            'balance': balance
                        };
                        valuesToReturn.inputs.push(newInput);
                    }
                });
                try {
                    callback(null, valuesToReturn);
                } catch (err) {
                    alert(err);
                }
                if (end >= options.start) {
                    loader(start - step, end - step);
                }else{
                    $('#tx_loading_notification').hide();
                    setTimeout(function () { loadWalletData(callback); }, 5000); // Periodically update the wallet.
                }
            });
        });
    };

    loader(end - step, end);
};

function getMostRecentAddressIndex(seed, callback){
    var step = 100;

    var getLastAddressIndex = function(min_nohit, index){
        index = Math.floor(index);
        var addressOptions = {
            index: index,
            total: 1,
            returnAll: false,
            security: 2
        };

        try {
            iota.api.getNewAddress(seed, addressOptions, function (error, addresses) {
                if (error) return callback(error);

                iota.api.findTransactions({addresses: addresses}, function (err, transactions) {
                    if (err) return callback(err);
                    try {
                        if (transactions.length === 1 && min_nohit === index + 1) {
                            return callback(err, index);
                        }

                        if (transactions.length > 0) {
                            if (index >= min_nohit) {
                                return getLastAddressIndex(index * 2, index * 2);
                            } else {
                                return getLastAddressIndex(min_nohit, (min_nohit + index) / 2);
                            }
                        } else {
                            if (index <= min_nohit) {
                                return getLastAddressIndex(index, (min_nohit - index) / 2);
                            } else {
                                return getLastAddressIndex(min_nohit, (index + min_nohit) / 2);
                            }
                        }
                    }catch(err){
                        alert(err);// TODO: Message instead
                    }
                })
            });
        }
        catch (err){
            alert(err);
        }
    };

    getLastAddressIndex(step, step);// TODO: If no addresses
}
