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
        $(".clickable-row").off().click(function() {
            openTransactionWindow($(this).attr("bundle_id"));
        });

        var pager = $('.pager');
        pager.empty();
        var currPage = pager.data('curr') || 0;
        $('#transaction_list').pageMe({pagerSelector:'#transaction_pager',showPrevNext:true,hidePageNumbers:false,perPage:10, pageNum: currPage});
    }catch (err){
        (document).getElementById('wallet_show_notifications').innerHTML = "<div class='alert alert-danger'>" + err + "</div>";
    }
}

function transactionsToHtmlTable(table, transactions){
    for (var i = 0; i < transactions.length; i++){
        var tail = transactions[i][0];
        var persistence = getPersistence(transactions[i]);

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
        row.setAttribute('bundle_id', tail.bundle);

        var direction = row.cells[0];
        var date = row.cells[1];
        var value = row.cells[2];
        var status = row.cells[3];

        if (getUnique(transactions[i], txAddressComparer).length === 1){
            direction.innerHTML = "<i class='fa fa-thumb-tack' title='Address was attached to tangle' aria-hidden='true'></i>";
        }else{
            direction.innerHTML = tail.direction === 'in' ?
                "<i class='fa fa-angle-right' style='color:#008000' aria-hidden='true' title='Incoming'></i>" :
                "<i class='fa fa-angle-left' style='color:#FF0000' aria-hidden='true' title='Outgoing'></i>";
        }

        var d = new Date(tail.timestamp*1000);
        var today = new Date().toDateString();
        date.innerHTML = today === d.toDateString() ? d.toLocaleTimeString() : d.toLocaleDateString();
        date.setAttribute('timestamp', tail.timestamp);
        value.innerHTML = convertIotaValuesToHtml(findTxAmount(transactions[i]));
        status.innerHTML = persistence ? 'Completed' : 'Pending';
    }
}

function openTransactionWindow(bundle_id) {
    document.getElementById('transaction-notifications').innerHTML = '';
    $('#transactionModal').modal('show');

    var b;
    for (var i = 0; i < window.walletData.transfers.length; i++){
        var transfer = window.walletData.transfers[i][0];
        if (transfer.bundle === bundle_id){
            b = window.walletData.transfers[i];
            break;
        }
    }

    if (b === null){
        return document.getElementById('transaction-notifications').innerHTML = "<div class='alert alert-success'>Bundle \'" + hash + "\' not found</div>";
    }

    var tail = b[0];
    var persistence = getPersistence(b);
    window.openTail = tail;
    document.getElementById('bundle_div').innerHTML = tail.bundle;
    document.getElementById('amount_div').innerHTML = 'You ' + (tail.direction === 'in' ? 'received' : 'sent') + ' <b>' + findTxAmount(b) + '</b> IOTAs';
    document.getElementById('datetime_div').innerHTML = 'At ' + new Date(tail.timestamp*1000).toLocaleString();
    document.getElementById('status_div').innerHTML = persistence ? 'Completed' : 'Pending';
    document.getElementById('message_div').innerHTML = getMessage(tail);
    if (tail.numReplays > 1){
        document.getElementById('num_replays').innerHTML = 'This bundle has been reattached ' + (tail.numReplays - 1) + ' times';
    }
    bundleToHtmlTable(document.getElementById('bundle_list'), b);

    $('#replay').hide();
    $('#double_spend_info').hide();
    if (!persistence){
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

    var l = Ladda.create(btn);
    l.start();

    try {
        replayBundleWrapper(window.openTail.hash, onReplaySelectedTransferCallback);
    }catch(e){
        alert(e);
    }
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
    loadWalletDataRange(0, getLastKnownAddressIndex() - window.defaultNumAddessesToLoad, onGetWalletData, function(e, res){
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
        window.loadingTimeout *= 0.05;   // Update less and lass frequently as the user becomes inactive
        window.walletDataLoader = setTimeout(function () {
            loadWalletData(function(e, res, progress){
                onGetWalletData(e, res);//Don't want to show progress for live loads
            }, onTxLoadingFinished);
        }, Math.floor(window.loadingTimeout));

        $('#tx_loading_notification').hide();
        $('#loadAllTransactionsDiv').show();
    }
}