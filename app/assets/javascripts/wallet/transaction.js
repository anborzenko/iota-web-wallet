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

        addPager();
    }catch (err){
        renderDangerAlert('wallet_show_notifications', err);
    }
}

function transactionsToHtmlTable(table, transactions){
    for (var i = 0; i < transactions.length; i++){
        var tail = transactions[i][0];

        if(getUnique(transactions[i], addressComparer).length === 1){
            // Address attachment. Ignore
            continue;
        }

        var persistence = getPersistence(transactions[i]);

        var rowIndex = getArrayIndex(table.rows, tail, compareTableRowAndTx);
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

        direction.innerHTML = tail.direction === 'in' ?
            "<i class='fa fa-angle-right' style='color:#008000' aria-hidden='true' title='Incoming'></i>" :
            "<i class='fa fa-angle-left' style='color:#FF0000' aria-hidden='true' title='Outgoing'></i>";

        var d = new Date(tail.timestamp*1000);
        var today = new Date().toDateString();
        date.innerHTML = today === d.toDateString() ? d.toLocaleTimeString() : d.toLocaleDateString();
        date.setAttribute('timestamp', tail.timestamp);
        value.innerHTML = convertIotaValuesToHtml(Math.abs(findTxAmount(transactions[i])));
        status.innerHTML = persistence ? 'Completed' : 'Pending';
    }

    checkForDoubleSpends(transactions);
}

function checkForDoubleSpends(transactions){
    var sendAddresses = [];
    var txs = [];
    var tails = [];

    for (var i = 0; i < transactions.length; i++){
        for (var j = 0; j < transactions[i].length; j++){
            var tx = transactions[i][j];
            if (tx.value < 0 && !getPersistence(transactions[i])){
                sendAddresses.push(tx.address);
                txs.push(tx);
                tails.push(transactions[i][0]);
            }
        }
    }

    window.iota.api.getBalances(sendAddresses, 100, function(e, balances){
        var addedBundleIndexes = [];
        var table = document.getElementById('transaction_list');

        for (var i = 0; i < balances.balances.length; i++){
            var tx = txs[i];
            var tail = tails[i];
            if (Math.abs(tx.value) > parseInt(balances.balances[i])){
                // Double spend
                var row = table.rows[getArrayIndex(table.rows, tx, compareTableRowAndTx)];
                var direction = row.cells[0];
                var status = row.cells[3];
                status.innerHTML = 'Failed';
                direction.innerHTML = tail.direction === 'in' ?
                    "<i class='fa fa-angle-double-right' style='color:#008000' aria-hidden='true' title='Incoming double spend'></i>" :
                    "<i class='fa fa-angle-double-left' style='color:#FF0000' aria-hidden='true' title='Outgoing double spend'></i>";
            }else{
                // Not double spend. Add the tx to the balance if it has not been added before
                var bIndex = getArrayIndex(transactions, tx, txInBundleComparer);
                if (bIndex !== -1 && !isInArray(addedBundleIndexes, bIndex, plainComparer)) {
                    var bundle = transactions[bIndex];
                    addedBundleIndexes.push(bIndex);
                    addPendingToBalance(findTxAmount(bundle));
                }
            }
        }
    });
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
        return renderDangerAlert('transaction-notifications', "Bundle \'" + hash + "\' not found");
    }

    var tail = b[0];
    var persistence = getPersistence(b);
    window.openTail = tail;
    document.getElementById('bundle_div').innerHTML = tail.bundle;
    document.getElementById('amount_div').innerHTML = 'You ' +
        (tail.direction === 'in' ? 'received' : 'sent') + ' <b>' + Math.abs(findTxAmount(b)) + '</b> IOTAs';
    document.getElementById('datetime_div').innerHTML = 'At ' + new Date(tail.timestamp*1000).toLocaleString();
    document.getElementById('status_div').innerHTML = persistence ? 'Completed' : 'Pending';
    document.getElementById('message_div').innerHTML = getMessage(tail);
    if (tail.numReplays > 1){
        document.getElementById('num_replays').innerHTML = 'This bundle has been reattached ' + (tail.numReplays - 1) + ' times';
    }else{
        document.getElementById('num_replays').innerHTML = '';
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
        return renderDangerAlert('transaction-notifications',
            'Could not load the transaction. Please contact support if this problem persists');
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
        return renderDangerAlert('transaction-notifications', "Failed to re-attach. " + e.message);
    }
    renderSuccessAlert('transaction-notifications', 'The transaction was re-attached');
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
            renderDangerAlert('wallet_show_notifications',
                "Failed to load all. " + (e.hasOwnProperty('message') ? e.message : e));
        }
        window.isCurrentlyLoadingAll = false;
        onTxLoadingFinishedFirstTime();
        $('#txLoadingWrapper').hide();
    });
}

function showTxLoadUI(){
    document.getElementById('transactionLoadStatus').innerHTML = '0%';
    $('#tx_loading_notification').show();
    $('#loadAllTransactionsDiv').hide();
}

// Called the first time the txs has finished loading
function onTxLoadingFinishedFirstTime(){
    onTxLoadingFinished();

    $('#tx_loading_notification').hide();
    $('#loadAllTransactionsDiv').show();

    // Pre fill the send form if everything needed is supplied in the url
    if (window.location.href.indexOf('recipient') !== -1){
        try {
            openSendWindowAndPrefill();
        }catch(err){}
    }

    uploadUnspentAddresses(window.numAddressesToSaveOnServer)
}

// Called every time the txs has finished loading
function onTxLoadingFinished(){
        window.loadingTimeout *= 1.05;   // Update less and lass frequently as the user becomes inactive
        window.walletDataLoader = setTimeout(function () {
            loadWalletData(function(e, res, progress){
                onGetWalletData(e, res);//Don't want to show progress for live loads
            }, onTxLoadingFinished);
        }, Math.floor(window.loadingTimeout));
}

function addPager(){
    var pager = $('.pager');
    pager.empty();
    var currPage = pager.data('curr') || 0;

    $('#transaction_list').pageMe({
        pagerSelector:'#transaction_pager',showPrevNext:true,hidePageNumbers:false,perPage:10, pageNum: currPage
    });
}