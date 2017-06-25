/**
 * Created by Daniel on 25.06.2017.
 */

function onCustomTransferClick(btn){
    var seed = $("#seed_input").val();
    var addressFrom = $("#address_from_input").val();
    var index = parseInt($("#index_input").val());
    var secLev = parseInt($("#sec_level").val());
    var addressTo = $("#address_to_input").val();
    var amount = parseInt($("#amount_input").val());

    var l = Ladda.create(btn);
    l.start();

    iota.api.getBalances([addressFrom], 100, function(e, res){
        if (e){
            resetForm(l);
            document.getElementById('progress_text').innerHTML = '';
            return document.getElementById('custom_send_notifications').innerHTML = "<div class='alert alert-danger'>Something went wrong: " + e + "</div>";
        }

        var balance = parseInt(res.balances[0]);
        if (balance < amount){
            resetForm(l);
            document.getElementById('progress_text').innerHTML = '';
            return document.getElementById('custom_send_notifications').innerHTML = "<div class='alert alert-danger'>The address only has a balance of " + balance + "</div>";
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
    resetForm();

    if (e){
        document.getElementById('progress_text').innerHTML = '';
        return document.getElementById('custom_send_notifications').innerHTML = "<div class='alert alert-danger'>Something went wrong: " + e + "</div>";
    }

    document.getElementById('progress_text').innerHTML = 'Transfer succeeded';
}

function resetForm(laddaBtn){
    if (laddaBtn){
        laddaBtn.stop();
    }else{
        Ladda.stopAll();
    }

    document.getElementById('custom_send_notifications').innerHTML = '';
}