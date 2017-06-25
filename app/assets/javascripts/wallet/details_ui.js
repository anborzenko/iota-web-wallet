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

    generateNewAddress(function(e, last_address){
        var seed = getSeed();
        var last_address_index = getLastKnownAddressIndex();
        var end = load_all ? 0 : last_address_index - window.defaultNumAddessesToLoad;

        var addresses = [];
        for (var i = last_address_index; i >= 0 && i >= end; i--){
            addresses.push(generateAddress(seed, i));
        }
        window.iota.api.getBalances(addresses, 100, function (e, res){
            onGetBalancesCustomCallback(e, res, addresses);
        });
    });
}

function onDownloadBackupClick(){
    download('seed.txt', getSeed());
}

function onGetBalancesCustomCallback(e, res, addresses){
    $("#loading").spin(false);
    $(document).find('#loading').hide();
    $(document).find('#addresses_div').show();

    if (e){
        return document.getElementById('wallet_options_notifications').innerHTML = "<div class='alert alert-danger'>Something went wrong: " + e + "</div>";
    }

    var table = document.getElementById('address_list');
    table.innerHTML = '';
    for (var i = 0; i < res.balances.length; i++){
        var a = addresses[i];
        var b = res.balances[i];

        var row = table.insertRow(-1);
        var address = row.insertCell(0);
        var balance = row.insertCell(1);
        address.innerHTML = a;
        balance.innerHTML = b;
    }
}

function download(filename, text) {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}