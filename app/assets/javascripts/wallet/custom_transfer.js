/**
 * Created by Daniel on 25.06.2017.
 */

function onCustomTransferClick(btn){
    var seed = getSeed();
    var addressFrom = $("#address_from_input").val();
    var index = parseInt($("#index_input").val());
    var secLev = parseInt($("#sec_level").val());
    var addressTo = $("#address_to_input").val();
    var amount = parseInt($("#amount_input").val());

    var l = Ladda.create(btn);
    l.start();

    iota.api.getBalances([addressFrom], 100, function(e, res){
        if (e){
            resetCustomTransferForm();
            document.getElementById('progress_text').innerHTML = '';
            return renderDangerAlert('custom_send_notifications', "Something went wrong: " + e);
        }

        var balance = parseInt(res.balances[0]);
        if (balance < amount){
            resetCustomTransferForm();
            document.getElementById('progress_text').innerHTML = '';
            return renderDangerAlert('custom_send_notifications', "The address only has a balance of " + balance);
        }

        var inputs = [{
            'address': addressFrom,
            'keyIndex': index,
            'security': secLev,
            'balance': balance
        }];

        var transfer = [{
            'address': addressTo,
            'value': amount,
            'message': window.iota.utils.toTrytes('')
        }];

        sendTransferWrapper(seed, transfer, {'inputs': inputs}, onCustomTransferFinished, function (progress, text) {
            l.setProgress(progress);
            document.getElementById('progress_text').innerHTML = text;
        });
    });
}

function onCustomTransferFinished(e, res){
    resetCustomTransferForm();

    if (e){
        document.getElementById('progress_text').innerHTML = '';
        return renderDangerAlert('custom_send_notifications', "Something went wrong: " + e);
    }

    document.getElementById('progress_text').innerHTML = 'Transfer succeeded';
}

function resetCustomTransferForm(){
    Ladda.stopAll();

    removeAlert('custom_send_notifications');
}