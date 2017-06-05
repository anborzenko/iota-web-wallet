/**
 * Created by Daniel on 05.06.2017.
 */

function populateTransactions(data){
    try {
        let cTransfers = categorizeTransactions(data.transfers, data.addresses);
        let tflat = [];
        for (let i = 0; i < cTransfers.sent.length; i++){
            let transfer = cTransfers.sent[i][0];
            transfer.direction = 'out';
            tflat.push(transfer);
        }

        for (let i = 0; i < cTransfers.received.length; i++){
            let transfer = cTransfers.received[i][0];
            transfer.direction = 'in';
            tflat.push(transfer);
        }

        tflat.sort(function (x, y){
           return y.timestamp - x.timestamp;
        });

        transactionsToHtmlTable((document).getElementById('transaction_list'), tflat);
        $(".clickable-row").click(function() {
            openTransactionWindow($(this).attr("bundle"));
        });

        (document).getElementById('transaction_pager').innerHTML = "";
        $('#transaction_list').pageMe({pagerSelector:'#transaction_pager',showPrevNext:true,hidePageNumbers:false,perPage:10});
    }catch (err){
        alert(err);
    }
}

function transactionsToHtmlTable(table, transactions){
    table.innerHTML = "";
    let today = new Date().toDateString();

    for (let i = 0; i < transactions.length; i++){
        let transfer = transactions[i];

        let row = table.insertRow(-1);
        row.classList.add('clickable-row');
        row.setAttribute('bundle', transfer.bundle);
        let direction = row.insertCell(0);
        let date = row.insertCell(1);
        let value = row.insertCell(2);
        let status = row.insertCell(3);

        let d = new Date(transfer.timestamp*1000);
        direction.innerHTML = transfer.direction === 'in' ?
            "<span class='glyphicon glyphicon-chevron-right' style='color:#008000' title='Received'></span>" :
            "<span class='glyphicon glyphicon-chevron-left' style='color:#FF0000' title='Sent'></span>";
        date.innerHTML = today === d.toDateString() ? d.toLocaleTimeString() : d.toLocaleDateString();
        value.innerHTML = convertIotaValuesToHtml(transfer.value);
        status.innerHTML = transfer.persistence ? 'Completed' : 'Pending';
    }
}


function openTransactionWindow(bundle) {
    $('#transactionModal').modal('show');

    let b;
    for (let i = 0; i < walletData.transfers.length; i++){
        let transfer = walletData.transfers[i][0];
        if (transfer.bundle === bundle){
            b = walletData.transfers[i];
            break;
        }
    }

    if (b === null){
        document.getElementById('transaction-notifications').innerHTML = "<div class='alert alert-success'>Transaction \'" + hash + "\' not found</div>";
        return;
    }

    let tail = b[0];
    document.getElementById('bundle_div').innerHTML = tail.bundle;
    document.getElementById('amount_div').innerHTML = 'You ' + (tail.direction === 'in' ? 'received' : 'sent') + ' <b>' + tail.value + '</b> IOTAs';
    document.getElementById('datetime_div').innerHTML = 'At ' + new Date(tail.timestamp*1000).toLocaleString();
    document.getElementById('status_div').innerHTML = tail.persistence ? 'Completed' : 'Pending';
    document.getElementById('message_div').innerHTML = getMessage(tail);
    bundleToHtmlTable(document.getElementById('bundle_list'), b)
}

function bundleToHtmlTable(table, bundle){
    table.innerHTML = "";
    bundle.forEach(function(t){
        let row = table.insertRow(-1);
        let value = row.insertCell(0);
        let address = row.insertCell(1);
        let hash = row.insertCell(2);

        value.innerHTML = t.value + ' IOTAs';
        address.innerHTML = t.address;
        hash.innerHTML = t.hash;
    });
}
