/**
 * Created by Daniel on 13.06.2017.
 */
function transferComparer(a, b){
    a = a[0];
    b = b[0];
    return a.timestamp === b.timestamp && a.bundle === b.bundle && a.persistence === b.persistence;
}

function transferChangedPersistenceComparer(a, b){
    a = a[0];
    b = b[0];
    return a.timestamp === b.timestamp && a.bundle === b.bundle && a.persistence !== b.persistence;
}

function inputComparer(a, b){
    return a.address === b.address && a.balance === b.balance;
}

function inputAddressComparer(a, b){
    return a.address === b.address;
}

function compareTableRowAndTail(tail, row){
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

function txAddressComparer(a, b){
    return a.address === b.address;
}

function plainComparer(a, b){
    return a === b;
}