/**
 * Created by Daniel on 17.06.2017.
 */


function loginAdmin(){
    sessionStorage.setItem('private_key', $('#privkey').val());
    sessionStorage.setItem('public_key', $('#pubkey').val());
    try {
        $.ajax({
            type: "GET",
            url: 'login',
            data: {pk: sessionStorage.getItem('public_key')},
            dataType: "JSON",
            success: function(){document.location.href = 'dashboard';},
            error: function(err) {console.write(err)}
        });
    }catch(err){console.write(err)}
}

function loadAdminDashboardData(){
    alert(sessionStorage.getItem('public_key'));
    try {
        $.ajax({
            type: "GET",
            url: 'get_data',
            data: {pk: sessionStorage.getItem('public_key')},
            dataType: "JSON",
            success: onLoadAdminDashboardCallback,
            error: function(err) {alert(err)}
        });
    }catch(err){alert(err)}
}

function onLoadAdminDashboardCallback(response){
    var decrypt = new JSEncrypt();
    decrypt.setPrivateKey(sessionStorage.getItem('private_key'));

    document.getElementById('content').innerHTML = decrypt.decrypt(response.content);
}