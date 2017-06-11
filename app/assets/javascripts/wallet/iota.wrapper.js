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

function arrayCopy(src, src_start, dst, dst_start, len){
    for (var i = src_start; i < src_start + len; i++){
        dst[dst_start + (i - src_start)] = src[i];
    }
}