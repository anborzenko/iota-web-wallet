/**
 * Created by Daniel on 17.06.2017.
 */


function loginAdmin(){
    sessionStorage.setItem('private_key', $('#privkey').val());
    try {
        $.ajax({
            type: "GET",
            url: 'login',
            data: {pk: sessionStorage.getItem('private_key')},
            dataType: "JSON",
            success: function(){document.location.href = 'dashboard';},
            error: function(err) {console.write(err)}
        });
    }catch(err){console.write(err)}
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
