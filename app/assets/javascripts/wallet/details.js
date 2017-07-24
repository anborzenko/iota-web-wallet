/**
 * Created by Daniel on 24.06.2017.
 */


function initOptions(){
    loadAddresses(false);
}

function loadAddresses(load_all){
    $("#loading").spin(true);
    $(document).find('#loading').show();
    $(document).find('#addresses_div').hide();
    var seed = getSeed();

    generateNewAddress(function(e, last_address){
        var last_address_index = getLastSpentAddressIndex();
        var end = load_all ? 0 : last_address_index - window.defaultNumAddessesToLoad;

        var addresses = [];
        for (var i = last_address_index; i >= 0 && i >= end; i--){
            addresses.push(addChecksum(generateAddress(seed, i)));
        }
        window.iota.api.getBalances(addresses, 100, function (e, res){
            populateAddressTable(e, res, addresses, i+1);
        });
    });
}

function populateAddressTable(e, res, addresses, start_index){
    $("#loading").spin(false);
    $(document).find('#loading').hide();
    $(document).find('#addresses_div').show();

    if (e){
        return renderDangerAlert('wallet_options_notifications', "Something went wrong: " + e);
    }

    var table = document.getElementById('address_list');
    table.innerHTML = '';
    for (var i = 0; i < res.balances.length; i++){
        var a = addresses[i];
        var b = res.balances[i];

        var row = table.insertRow(-1);
        var index = row.insertCell(0);
        var address = row.insertCell(1);
        var balance = row.insertCell(2);
        index.innerHTML = start_index + (res.balances.length - i - 1);
        address.innerHTML = a;
        balance.innerHTML = b;
    }
}

function onEncryptedDownloadBackupClick(){
    download(JSON.stringify({ 'seed': getSeed() }), 'iota.json');
}

function onDecryptedDownloadBackupClick(){
    download(getEncryptedSeed(), 'iota.json');
}