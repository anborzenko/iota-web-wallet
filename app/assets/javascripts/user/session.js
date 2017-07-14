/**
 * Created by dl6764 on 14.07.2017.
 */

function getPasswordHash(){
    var pass = sessionStorage.getItem('unnamed');
    if (pass){
        return sjcl.hash.sha256.hash(pass).join('');
    }
}

function getUsername(){
    return readCookie('username');
}

function getEncryptedSeed(){
    return sessionStorage.getItem('seed');
}

function saveLogin(cvalue, password, username) {
    sessionStorage.setItem("unnamed", password);
    sessionStorage.setItem("seed", encrypt(password, cvalue));

    // The backend code need this to determine if the user is logged in
    // Stay "logged in" for 1 hour
    createCookie('isLoggedIn', true, 1 / 24.0);

    if (username){
        createCookie('username', username, 1 / 24.0);
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

function logOut() {
    eraseCookie('isLoggedIn');
    eraseCookie('username');
    sessionStorage.removeItem('seed');
    sessionStorage.removeItem('unnamed');
    sessionStorage.removeItem('haveUploadedUnspentAddresses')
}