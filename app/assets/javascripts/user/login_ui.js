/**
 * Created by Daniel on 04.06.2017.
 */

function openWithSeed() {
    var seed = $('#wallet_seed').val();
    if (seed.length !== 81){
        document.getElementById('notifications').innerHTML = "<div class='alert alert-danger'>Your seed is too short. It must be exactly 81 characters long</div>";
        return;
    } else if (!validateSeed(seed)){
        document.getElementById('notifications').innerHTML = "<div class='alert alert-danger'>Error: Invalid seed. It can only contain capital letters A to Z and the number 9</div>";
        return;
    }

    saveLogin(seed, generateRandomSeed());
    redirect_to('show');
}

function onGenerateSeedClick() {
    var seed = generateRandomSeed();
    $('#wallet_seed').val(seed);
}

function openSignupConfirmation(btn){
    var username = $('#wallet_username').val();
    var password = $('#wallet_password').val();
    validateUserInput(username, password);

    var l = Ladda.create(btn);
    l.start();
    $.ajax({
        type: "GET",
        url: 'exists',
        data: {'username': username},
        dataType: "JSON",
        success: function (response) {
            Ladda.stopAll();
            if (!response.exists){
                $('#loginTab').hide();
                $('#signUpTab').show();
                $('#confirm2fa').hide();
            }else{
                document.getElementById('notifications').innerHTML = "<div class='alert alert-danger'>The username is already taken</div>";
            }
        },
    });
}

function resetForm(){
    $('#loginTab').show();
    $('#signUpTab').hide();
    $('#confirm2fa').hide();
    $('#login2faTab').hide();
}

function signup(btn) {
    var username = $('#wallet_username').val();
    var password = $('#wallet_password').val();
    var password_confirmation = $('#wallet_password_confirmation').val();
    var enable_2fa = $('#enable2FaCheckbox').is(":checked");

    validateUserInput(username, password);
    if (password !== password_confirmation){
        return document.getElementById('notifications').innerHTML = "<div class='alert alert-danger'>Passwords do not match</div>";
    }

    var l = Ladda.create(btn);
    l.start();
    try {
        var seed = generateRandomSeed();
        var encryptedSeed = encrypt(password, seed);
    }catch(err){
        return document.getElementById('notifications').innerHTML = "<div class='alert alert-danger'>" + err + "</div>";
    }

    $.ajax({
        type: "GET",
        url: 'signup',
        data: {'username': username,
               'encrypted_seed': encryptedSeed,
               'has2fa': enable_2fa,
               'password_hash': sjcl.hash.sha256.hash(password).join('')
        },

        dataType: "JSON",
        success: function (response) {
            Ladda.stopAll();
            if (response.success){
                saveLogin(seed, password, username);
                if (enable_2fa){
                    $('#loginTab').hide();
                    $('#signUpTab').hide();
                    $('#confirm2fa').show();
                    document.getElementById('qr').innerHTML = response.qr;
                }else {
                    redirect_to('show');
                }
            }else{
                document.getElementById('notifications').innerHTML = "<div class='alert alert-danger'>" + response.message + "</div>";
            }
        },
    });
}

function onConfirm2faClick(btn){
    var otp_key = $('#otp_key_signup').val();
    var username = $('#wallet_username').val();
    var password = $('#wallet_password').val();
    validateUserInput(username, password);

    if (otp_key.length === 0){
        return document.getElementById('notifications').innerHTML = "<div class='alert alert-danger'>Invalid key</div>";
    }

    var l = Ladda.create(btn);
    l.start();

    $.ajax({
        type: "GET",
        url: 'confirm2fa',
        data: { 'otp_key': otp_key, 'username': username },
        dataType: "JSON",
        success: function (response) {
            Ladda.stopAll();
            if (response.success){
                try{
                    var seed = decrypt(password, response.encrypted_seed);
                    saveLogin(seed, password, username);
                }catch(err){
                    return document.getElementById('notifications').innerHTML = "<div class='alert alert-danger'>Invalid password</div>";
                }

                document.getElementById('notifications').innerHTML = "<div class='alert alert-success'>" +
                    "Two factor authentication has been successfully enabled. Redirecting to wallet in 3 seconds</div>";
                setTimeout(function () {
                    redirect_to('show');
                }, 3000)
            }else{
                document.getElementById('notifications').innerHTML = "<div class='alert alert-danger'>" + response.message + "</div>";
            }
        },
    });
}

function login (btn, require_first_time_proof) {
    try {
        var username = $('#wallet_username').val();
        var password = $('#wallet_password').val();
        validateUserInput(username, password);

        var data = {'username': username, 'password_hash': sjcl.hash.sha256.hash(password).join('')};
        if (require_first_time_proof) {
            // This is only required once. The password is never stored. See the
            // wallet controller for an in depth description about this.
            data['password'] = password;
        }

        var l = Ladda.create(btn);
        l.start();
    }catch(err){
        return document.getElementById('notifications').innerHTML = "<div class='alert alert-danger'>Error: " + err + "</div>";
    }

    $.ajax({
        type: "GET",
        url: 'login',
        data: data,
        dataType: "JSON",
        success: function (response) {
            Ladda.stopAll();
            if (response.success){
                try{
                    var seed = decrypt(password, response.encrypted_seed);
                    saveLogin(seed, password, username);
                    redirect_to('show');
                }catch(err){
                    return document.getElementById('notifications').innerHTML = "<div class='alert alert-danger'>Invalid password</div>";
                }
            }else if (response.require_2fa) {
                $('#login2faTab').show();
                $('#loginTab').hide();
            }else if (response.require_2fa_confirmation) {
                $('#loginTab').hide();
                $('#confirm2fa').show();
                document.getElementById('qr').innerHTML = response.qr;
            }else if (response.require_first_time_proof){
                login(btn, true)
            }else{
                document.getElementById('notifications').innerHTML = "<div class='alert alert-danger'>" + response.message + "</div>";
            }
        },
    });
}

function on2faLoginClick(btn){
    var username = $('#wallet_username').val();
    var password = $('#wallet_password').val();
    var otp_key = $('#otp_key_login').val();

    var data = {'username': username, 'password_hash': sjcl.hash.sha256.hash(password).join(''), otp_key: otp_key};

    var l = Ladda.create(btn);
    l.start();
    $.ajax({
        type: "GET",
        url: 'login',
        data: data,
        dataType: "JSON",
        success: function (response) {
            Ladda.stopAll();
            if (response.success){
                try{
                    var seed = decrypt(password, response.encrypted_seed);
                    saveLogin(seed, password, username);
                    redirect_to('show');
                }catch(err){
                    document.getElementById('notifications').innerHTML = "<div class='alert alert-danger'>Invalid password</div>";
                }
            }else{
                if (response.require_2fa){
                    document.getElementById('notifications').innerHTML = "<div class='alert alert-danger'>Invalid authentication key. Try again</div>";
                }else{
                    document.getElementById('notifications').innerHTML = "<div class='alert alert-danger'>" + response.message + "</div>";
                }
            }
        },
    });
}

function signout(){
    deleteLogin();
    window.location = '/';
}

function validateUserInput(username, password){
    var minPasswordLength = 8;

    if (password.length < minPasswordLength){
        document.getElementById('notifications').innerHTML = "<div class='alert alert-danger'>Your password must be at least " + minPasswordLength + " characters long</div>";
        throw('Invalid input');
    }else if (username.length === 0){
        document.getElementById('notifications').innerHTML = "<div class='alert alert-danger'>Your username cannot be empty</div>";
        throw('Invalid input');
    }else{
        document.getElementById('notifications').innerHTML = "<div class='alert alert-warning'>" +
            "<b>Important</b>: Remember to backup your credentials, including your seed. They cannot be recovered once they are lost!</div>";
    }
}