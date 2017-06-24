/**
 * Created by Daniel on 17.06.2017.
 */


function loginAdmin(){
    sessionStorage.setItem('private_key', $('#privkey').val());
    document.location.href = 'dashboard';
}

function loadAdminDashboardData(){
    try {
        $.ajax({
            type: "GET",
            url: 'get_data',
            data: {pk: sessionStorage.getItem('private_key')},
            dataType: "JSON",
            success: onLoadAdminDashboardCallback,
            error: function(err) {alert(err)}
        });
    }catch(err){alert(err)}
}

function onLoadAdminDashboardCallback(response){
    try {
        document.getElementById('content').innerHTML = JSON.stringify(response);
    }catch(err){
        alert('onloaddashboardcallback: ' + err);
    }
}
