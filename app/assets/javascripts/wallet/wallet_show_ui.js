/**
 * Created by Daniel on 04.06.2017.
 */

function onGetWalletDataFinished(e, accountData) {
    if (window.location.href.indexOf('wallets/show') === -1){
        return;
    }
    $("#loading").spin(false); // Hide the spinner

    if (e){
        document.getElementById('loading').innerHTML = "<div class='alert alert-danger'>Could not load your wallet. Please check the node health. " + e.message + "</div>";
        return;
    }
    addWalletData(accountData);

    $(document).find('#loading').hide();
    $(document).find('#wallet-data').show();
    populateWallet(walletData);
    populateTransactions(accountData);
}

function populateWallet(data){
    $("#seed_box").val(getSeed());
    document.getElementById("wallet_balance_summary").innerHTML = convertIotaValuesToHtml(sumDictValues(data.balances));
    document.getElementById("wallet_balance").innerHTML = '<b>' + sumDictValues(data.balances) + '</b> IOTAs';
    $('#address_box').val(addChecksum(data.latestAddress));
}

function convertIotaValuesToHtml(value){
    var units = ['i', 'Ki', 'Mi', 'Gi', 'Ti', 'Pi'];
    value = value.toString();
    var minNumBeforeDecimal = 1;

    var i = Math.floor((value.length - minNumBeforeDecimal) / 3);
    if (i >= units.length){
        i = units.length-1;
    }

    return '<b>' + Math.floor(iota.utils.convertUnits(value, units[0], units[i])) + '</b> ' + units[i];
}

function showSeed(){
    document.getElementById('seed_box').type = 'text';
}

function onGenerateAddressClick(){
    if (!walletData){
        return;
    }
    $("#refresh_address_glyph").attr('class', 'glyphicon glyphicon-refresh glyphicon-refresh-animate');
    document.getElementById('address_generation_status').innerHTML = 'Attaching';
    attachAddress(walletData.latestAddress, onAttachBeforeGenerateAddressCallback);
}

function onAttachBeforeGenerateAddressCallback(e, res){
    if (e){
        document.getElementById('address_generation_status').innerHTML = 'Failed';
        $("#refresh_address_glyph").attr('class', 'glyphicon glyphicon-refresh icon-clickable');
        return document.getElementById('wallet_show_notifications').innerHTML =
            "<div class='alert alert-danger'>Failed to generate new address. " + e.message + "</div>";
    }

    document.getElementById('address_generation_status').innerHTML = 'Generating';
    generateNewAddress(onGenerateAddressCallback);
}

function onGenerateAddressCallback(e, res){
    $("#refresh_address_glyph").attr('class', 'glyphicon glyphicon-refresh icon-clickable');

    if (e){
        document.getElementById('address_generation_status').innerHTML = 'Failed';
        return document.getElementById('wallet_show_notifications').innerHTML =
            "<div class='alert alert-danger'>Failed to generate new address. " + e.message + "</div>";
    }
    res = addChecksum(res);
    $('#address_box').val(res);
    walletData.latestAddress = res;
    document.getElementById('address_generation_status').innerHTML = 'Done';
}