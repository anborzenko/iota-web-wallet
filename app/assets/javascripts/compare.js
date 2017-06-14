/**
 * Created by Daniel on 13.06.2017.
 */
function transferComparer(a, b){
    a = a[0];
    b = b[0];
    return a.hash === b.hash && a.timestamp === b.timestamp && a.bundle === b.bundle && a.persistence === b.persistence;
}

function inputComparer(a, b){
    return a.address === b.address;
}

function primitiveComparer(a, b){
    return a === b;
}

function compareTableRowAndTail(tail, row){
    return row.getAttribute('tid') === tail.persistence + tail.hash + tail.timestamp.toString();
}

function senderInputAddressComparer(input, tx){
    return getSenderAddress(tx) === input.address;
}