/**
 * Created by dl6764 on 14.07.2017.
 */

function getPasswordHash(){
    var pass = sessionStorage.getItem('unnamed');
    if (pass){
        return hashPassword(pass, getUsername());
    }
}

function hashPassword(pass, username){
    var rounds = 10;

    // MD5 it to get the appropriate salt length
    var hash = md5(username + 'iota-wallet.org');
    var salt = '$2a$' + rounds + '$' + hash;

    return dcodeIO.bcrypt.hashSync(pass, salt);
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

function updateSession(params){
    Object.keys(params).forEach(function (key) {
        if (sessionStorage.getItem(key)){
            sessionStorage.setItem(key, params[key]);
        }
    });
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