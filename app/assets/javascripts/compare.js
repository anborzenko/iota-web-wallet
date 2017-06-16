/**
 * Created by Daniel on 13.06.2017.
 */
function transferComparer(a, b){
    a = a[0];
    b = b[0];
    return a.timestamp === b.timestamp && a.bundle === b.bundle && a.persistence === b.persistence;
}

function inputComparer(a, b){
    return a.address === b.address;
}

function compareTableRowAndTail(tail, row){
    return row.getAttribute('bundle_id') === tail.bundle;
}

function senderInputAddressComparer(input, tx){
    return getSenderAddress(tx) === input.address;
}

function txInSameBundleComparer(a, b){
    return a.bundle === b.bundle;
}

function txAddressComparer(a, b){
    return a.address === b.address;
}
