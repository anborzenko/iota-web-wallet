/**
 * Created by Daniel on 08.06.2017.
 */

function sendTransferWrapper(iota_inst, seed, depth, minWeightMagnitude, transfer, options, callback){
    iota_inst.api.prepareTransfers(seed, transfer, options, function(error, trytes) {

        if (error) {
            return callback(error)
        }

        sendTrytesWrapper(iota_inst, trytes, depth, minWeightMagnitude, callback);
    })
}

function sendTrytesWrapper(iota_inst, trytes, depth, minWeightMagnitude, callback){
    iota_inst.api.getTransactionsToApprove(depth, function(error, toApprove) {
        if (error) {
            return callback(error)
        }

        attachToTangle(toApprove.trunkTransaction, toApprove.branchTransaction, minWeightMagnitude, trytes, function(error, attached) {
            if (error) {
                return callback(error)
            }

            iota_inst.api.broadcastAndStore(attached, function(error, success) {
                if (error) {
                    return callback(error);
                }

                var finalTxs = [];

                attached.forEach(function(trytes) {
                    finalTxs.push(Utils.transactionObject(trytes));
                });

                return callback(null, finalTxs);
            })
        })
    })
}

function attachToTangle(trunkTransaction, branchTransaction, minWeightMagnitude, trytes, callback){
    try {
        converterInit();
        branchTransaction = toTrits(branchTransaction);
        trunkTransaction = toTrits(trunkTransaction);
    }catch (err){
        alert(err);
    }

    var prevTransaction = null;
    var rec_pow = (res, i) => {
        try {
            if (i >= trytes.length) {
                alert('finished: ' + res);
                return callback(null, res);
            }

            var transactionTrits = toTrits(trytes[i]);
            arrayCopy(prevTransaction === null ? trunkTransaction : prevTransaction, 0, transactionTrits, TRUNK_TRANSACTION_TRINARY_OFFSET, TRUNK_TRANSACTION_TRINARY_SIZE);
            arrayCopy(prevTransaction === null ? branchTransaction : trunkTransaction, 0, transactionTrits, BRANCH_TRANSACTION_TRINARY_OFFSET, BRANCH_TRANSACTION_TRINARY_SIZE);

            prevTransaction = transactionTrits;

            curl.pow(toTrytes(transactionTrits, 0, transactionTrits.length), minWeightMagnitude
            ).then((hash) => {
                alert(hash);
                res.add(hash);
                return rec_pow(res, i + 1);
            }).catch((err) => {
                alert(err);
            });
        }catch(err){
            alert(err);
        }
    };

    rec_pow([], 0);
}