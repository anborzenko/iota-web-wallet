/**
 * Created by Daniel on 13.06.2017.
 */
function getSenderAddress(bundle){
    for (var j = 0; j < bundle.length; j++){
        if (bundle[j].value < 0 || j >= bundle.length - 1){
            return bundle[j].address;
        }
    }
}

function addWalletData(data){
    var tToRemove = [];
    for (var i = 0; i < data.transfers.length; i++){
        if (!isInArray(walletData.transfers, data.transfers[i], transferComparer)){
            walletData.transfers.push(data.transfers[i]);
        }else{
            tToRemove.push(i);
        }
    }
    var aToRemove = [];
    for (i = 0; i < data.addresses.length; i++){
        if (!isInArray(walletData.addresses, data.addresses[i], primitiveComparer)) {
            walletData.addresses.push(data.addresses[i]);
        }else{
            aToRemove.push(i);
        }
    }
    var iToRemove = [];
    for (i = 0; i < data.inputs.length; i++){
        if (!isInArray(walletData.inputs, data.inputs[i], inputComparer)) {
            walletData.inputs.push(data.inputs[i]);
        }else{
            iToRemove.push(i);
        }
    }
    data.transfers = removeIndexes(data.transfers, tToRemove);
    data.addresses = removeIndexes(data.addresses, aToRemove);
    data.inputs = removeIndexes(data.inputs, iToRemove);
    /*
    for (i = 0; i < data.addresses.length; i++){
        walletData.balances[data.addresses[i]] = data.balances[data.addresses[i]];
    }*/
    return data;
}

function getAddressBalance(address){
    for (var i = 0; i < walletData.inputs.length; i++){
        if (walletData.inputs[i].address === address){
            return walletData.inputs[i].balance;
        }
    }
    return 0;
}

