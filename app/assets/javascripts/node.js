/**
 * Created by Daniel on 10.06.2017.
 */

function onGetNodeInfoFinished(e, res){
    $("#loading").spin(false);

    $(document).find('#loading').hide();
    $(document).find('#node-data').show();

    var status_text = document.getElementById('node-status');
    var status_symbol = document.getElementById('node_status_symbol');
    if (e){
        status_symbol.style.color = "red";
        return status_text.innerHTML = "<div class='alert alert-danger'>The node is offline</div>";
    }

    if (res.latestMilestoneIndex === res.latestSolidSubtangleMilestoneIndex){
        status_symbol.style.color = "green";
    }else{
        status_text.innerHTML = "<div class='alert alert-warning'>The node is out of sync. Please wait for it to be synced up with the network</div>";
        status_symbol.style.color = "yellow";
    }

    var table = document.getElementById('node_info_table');
    Object.keys(res).forEach(function(key,index) {
        table.innerHTML += "<tr><td>" + key + "</td><td>" + res[key] + "</td></tr>";
    });
}

function onGetNodeStatusFinished(e, res){
    var status_symbol = document.getElementById('node_status_symbol');
    var status_wrapper = document.getElementById('node_status_wrapper');
    if (e){
        status_symbol.style.color = "red";
        status_wrapper.title = 'Node is offline'
    }else if (res.latestMilestoneIndex === res.latestSolidSubtangleMilestoneIndex){
        status_symbol.style.color = "green";
        status_wrapper.title = 'Node is synced'
    }else{
        status_symbol.style.color = "yellow";
        status_wrapper.title = 'Node is not synced'
    }

    // Periodically update the state
    setTimeout(function(){ onGetNodeStatusFinished(); }, 3000);
}