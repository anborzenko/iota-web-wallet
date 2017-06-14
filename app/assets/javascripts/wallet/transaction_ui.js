/**
 * Created by Daniel on 05.06.2017.
 */

function populateTransactions(data){
    try {
        if (data.transfers.length === 0){
            return;
        }
        var cTransfers = categorizeTransactions(data.transfers);
        var tflat = [];
        for (var i = 0; i < cTransfers.sent.length; i++){
            var transferOut = cTransfers.sent[i][0];
            transferOut.direction = 'out';
            tflat.push(cTransfers.sent[i]);
        }

        for (var i = 0; i < cTransfers.received.length; i++){
            var transferIn = cTransfers.received[i][0];
            transferIn.direction = 'in';
            tflat.push(cTransfers.received[i]);
        }

        tflat.sort(function (x, y){
           return y[0].timestamp - x[0].timestamp;
        });

        transactionsToHtmlTable((document).getElementById('transaction_list'), tflat);
        $(".clickable-row").click(function() {
            openTransactionWindow($(this).attr("tid"));
        });

        (document).getElementById('transaction_pager').innerHTML = "";
        $('#transaction_list').pageMe({pagerSelector:'#transaction_pager',showPrevNext:true,hidePageNumbers:false,perPage:10});
    }catch (err){
        (document).getElementById('wallet_show_notifications').innerHTML = "<div class='alert alert-danger'>" + err + "</div>";
    }
}

function transactionsToHtmlTable(table, transactions){
    for (var i = 0; i < transactions.length; i++){
        var tail = transactions[i][0];

        var rowIndex = getArrayIndex(table.rows, tail, compareTableRowAndTail);
        var row;
        if (rowIndex === -1){
            row = table.insertRow(findTableRowIndex(tail, table));
            row.insertCell(0);
            row.insertCell(1);
            row.insertCell(2);
            row.insertCell(3);
        }else{
            // Update existing
            row = table.rows[rowIndex];
        }
        row.classList.add('clickable-row');
        row.setAttribute('tid', tail.persistence + tail.hash + tail.timestamp.toString());

        var direction = row.cells[0];
        var date = row.cells[1];
        var value = row.cells[2];
        var status = row.cells[3];

        var balance = getAddressBalance(getSenderAddress(transactions[i]));
        if (transactions[i].length === 1){
            direction.innerHTML = "<i class='fa fa-thumb-tack' title='Address was attached to tangle' aria-hidden='true'></i>";
        }else if (balance === 0 && !tail.persistence && tail.value > 0 && tail.direction === 'out') {
            direction.innerHTML = "<i class='fa fa-angle-double-left' style='color:#FF0000' aria-hidden='true' title='Outgoing double spend'></i>"
            // TODO: Incoming double spend. Have to use getBalance async
        }else{
            direction.innerHTML = tail.direction === 'in' ?
                "<i class='fa fa-angle-right' style='color:#008000' aria-hidden='true' title='Incoming'></i>" :
                "<i class='fa fa-angle-left' style='color:#FF0000' aria-hidden='true' title='Outgoing'></i>";
        }

        var d = new Date(tail.timestamp*1000);
        var today = new Date().toDateString();
        date.innerHTML = today === d.toDateString() ? d.toLocaleTimeString() : d.toLocaleDateString();
        date.setAttribute('timestamp', tail.timestamp);
        value.innerHTML = convertIotaValuesToHtml(tail.value);
        status.innerHTML = tail.persistence ? 'Completed' : 'Pending';
    }
}

function openTransactionWindow(tid) {
    document.getElementById('transaction-notifications').innerHTML = '';
    $('#transactionModal').modal('show');

    var b;
    for (var i = 0; i < walletData.transfers.length; i++){
        var transfer = walletData.transfers[i][0];
        if (transfer.persistence + transfer.hash + transfer.timestamp.toString() === tid){
            b = walletData.transfers[i];
            break;
        }
    }

    if (b === null){
        return document.getElementById('transaction-notifications').innerHTML = "<div class='alert alert-success'>Bundle \'" + hash + "\' not found</div>";
    }

    var tail = b[0];
    window.openTail = tail;
    document.getElementById('bundle_div').innerHTML = tail.bundle;
    document.getElementById('amount_div').innerHTML = 'You ' + (tail.direction === 'in' ? 'received' : 'sent') + ' <b>' + tail.value + '</b> IOTAs';
    document.getElementById('datetime_div').innerHTML = 'At ' + new Date(tail.timestamp*1000).toLocaleString();
    document.getElementById('status_div').innerHTML = tail.persistence ? 'Completed' : 'Pending';
    document.getElementById('message_div').innerHTML = getMessage(tail);
    bundleToHtmlTable(document.getElementById('bundle_list'), b);

    $('#replay').hide();
    $('#double_spend_info').hide();
    if (!tail.persistence){
        isDoubleSpend(b, isDoubleSpendCallback);
    }
}

function isDoubleSpendCallback(e, res){
    if (!res){
        $('#replay').show();
    }else{
        $('#double_spend_info').show();
    }
}

function replaySelectedTransfer(btn){
    var tail_hash = document.getElementById('bundle_div').innerHTML;
    if (!tail_hash){
        return document.getElementById('transaction-notifications').innerHTML = "<div class='alert alert-danger'>" +
            "Could not load the transaction. Please contact support if this problem persists</div>";
    }

    replayBundle(openTail.hash, onReplaySelectedTransferCallback);

    var l = Ladda.create(btn);
    l.start();
}

function onReplaySelectedTransferCallback(e, res){
    Ladda.stopAll();

    if (e){
        return document.getElementById('transaction-notifications').innerHTML = "<div class='alert alert-danger'>Failed to re-attach. " + e.message + "</div>";
    }
    document.getElementById('transaction-notifications').innerHTML = "<div class='alert alert-success'>The transaction was re-attached</div>";;
}

function bundleToHtmlTable(table, bundle){
    table.innerHTML = "";
    bundle.forEach(function(t){
        var row = table.insertRow(-1);
        var value = row.insertCell(0);
        var address = row.insertCell(1);
        var hash = row.insertCell(2);

        value.innerHTML = t.value + ' IOTAs';
        address.innerHTML = t.address;
        hash.innerHTML = t.hash;
    });
}

function findTableRowIndex(tail, table){
    for (var i = 0; i < table.rows.length; i++) {
        var timestamp = parseInt(table.rows[i].cells[1].getAttribute('timestamp'));
        if (parseInt(tail.timestamp) > timestamp) {
            return i;
        }
    }
    return -1;
}

function loadAllTransactions(){
    window.isCurrentlyLoadingAll = true;
    showTxLoadUI();
    loadWalletDataRange(0, getLastKnownAddressIndex() - defaultNumAddessesToLoad, onGetWalletData, function(e, res){
        if (e){
            document.getElementById('wallet_show_notifications').innerHTML = "<div class='alert alert-danger'>Failed to load all. " + (e.hasOwnProperty('message') ? e.message : e) + "</div>";
        }
        window.isCurrentlyLoadingAll = false;
        onTxLoadingFinished();
        $('#txLoadingWrapper').hide();
    });
}

function showTxLoadUI(){
    document.getElementById('transactionLoadStatus').innerHTML = '0%';
    $('#tx_loading_notification').show();
    $('#loadAllTransactionsDiv').hide();
}

function onTxLoadingFinished(){
    if (!window.isCurrentlyLoadingAll) {
        window.walletDataLoader = setTimeout(function () {
            loadWalletData(function(e, res, progress){
                onGetWalletData(e, res);//Don't want to show progress for live loads
            }, onTxLoadingFinished);
        }, 10000);

        $('#tx_loading_notification').hide();
        $('#loadAllTransactionsDiv').show();
    }
}