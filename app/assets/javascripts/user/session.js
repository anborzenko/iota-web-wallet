/**
 * Created by dl6764 on 14.07.2017.
 */

function getPasswordHash(){
    var pass = sessionStorage.getItem('unnamed');
    if (pass){
        return hashPassword(pass);
    }
}

function hashPassword(pass){
    return sjcl.hash.sha256.hash(pass).join('');
}

function getUsername(){
    return sessionStorage.getItem('username');
}

function getEncryptedSeed(){
    return sessionStorage.getItem('seed');
}

function saveLogin(cvalue, password, username) {
    sessionStorage.setItem("unnamed", password);
    sessionStorage.setItem("seed", encrypt(password, cvalue));

    if (username){
        sessionStorage.setItem('username', username);
    }
}

function getSeed() {
    var password = sessionStorage.getItem('unnamed');
    var seed = getEncryptedSeed();
    if (seed !== null){
        return decrypt(password, seed);
    }

    redirect_to('/users/login');
    throw('Seed not found');
}

function redirectToLoginIfNotLoggedIn(){
    var seed = getEncryptedSeed();
    if (seed === null) {
        redirect_to('/users/login');
        throw('Not logged in');
    }
}

function logOut(redirect_url) {
    redirect_url = redirect_url || '/';

    sessionStorage.removeItem('username');
    sessionStorage.removeItem('seed');
    sessionStorage.removeItem('unnamed');
    sessionStorage.removeItem('haveUploadedUnspentAddresses');

    $.ajax({
        type: "GET",
        url: '/users/logout',
        success: function(response){
            redirect_to(redirect_url);
        },error: function(err){
            renderAjaxError('mainNotifiactionArea', err);
        }
    });
}