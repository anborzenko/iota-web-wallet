/**
 * Created by Daniel on 13.06.2017.
 */
function transferComparer(a, b){
    return a[0].bundle === b[0].bundle && getPersistence(a) === getPersistence(b);
}

function transferChangedPersistenceComparer(a, b){
    return a[0].bundle === b[0].bundle && getPersistence(a) !== getPersistence(b);
}

function inputComparer(a, b){
    return a.address === b.address && a.balance === b.balance;
}

function addressComparer(a, b){
    return a.address === b.address;
}

function compareTableRowAndTx(tail, row){
    return row.getAttribute('bundle_id') === tail.bundle;
}

function senderInputAddressComparer(input, tx){
    for (var i = 0; i < tx.length; i++) {
        if (tx[i].value < 0 && tx[i].address === input.address) {
            return true;
        }
    }
    return false;
}

function txInSameBundleComparer(a, b){
    return a.bundle === b.bundle;
}

function txInBundleComparer(a, b){
    b = b[0];
    return a.bundle === b.bundle;
}

function plainComparer(a, b){
    return a === b;
}