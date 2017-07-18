/**
 * Created by Daniel on 04.06.2017.
 */

function openWithSeed() {
    var seed = $('#wallet_seed').val();
    if (seed.length !== 81){
        return renderDangerAlert('notifications',
            'Your seed is too short. It must be exactly 81 characters long')
    } else if (!validateSeed(seed)){
        return renderDangerAlert('notifications',
            'Error: Invalid seed. It can only contain capital letters A to Z and the number 9');
    }

    saveLogin(seed, generateRandomSeed());
    $.ajax({
        type: "GET",
        url: 'seed_login',
        success: function (response) {
            redirect_to('/wallets/show');
        }
    });
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
                renderDangerAlert('notifications', 'The username is already taken');
            }
        },
        error: function(error){
            renderAjaxError('notifications', error);
        }
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
        return renderDangerAlert('notifications', 'Passwords do not match');
    }

    var l = Ladda.create(btn);
    l.start();
    try {
        var seed = generateRandomSeed();
        var encryptedSeed = encrypt(password, seed);
    }catch(err){
        return renderDangerAlert('notifications', err);
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
                    redirect_to('/wallets/show');
                }
            }else{
                renderDangerAlert('notifications', response.message);
            }
        },
        error: function(error){
            renderAjaxError('notifications', error);
        }
    });
}

function onConfirm2faClick(btn){
    var otp_key = $('#otp_key_signup').val();
    var username = $('#wallet_username').val();
    var password = $('#wallet_password').val();
    validateUserInput(username, password);

    if (otp_key.length === 0){
        return renderDangerAlert('notifications', 'Invalid key');
    }

    var l = Ladda.create(btn);
    l.start();

    $.ajax({
        type: "GET",
        url: 'confirm2fa',
        data: { 'otp_key': otp_key, 'username': username, 'password_hash': hashPassword(password) },
        dataType: "JSON",
        success: function (response) {
            Ladda.stopAll();
            if (response.success){
                try{
                    var seed = decrypt(password, response.encrypted_seed);
                    saveLogin(seed, password, username);
                }catch(err){
                    return renderDangerAlert('notifications', 'Invalid password');
                }

                renderSuccessAlert('notifications',
                    'Two factor authentication has been successfully enabled. Redirecting to wallet in 3 seconds');

                setTimeout(function () {
                    redirect_to('/wallets/show');
                }, 3000)
            }else{
                renderDangerAlert('notifications', response.message);
            }
        },
        error: function(error){
            Ladda.stopAll();
            renderAjaxError('notifications', error);
        }
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
        return renderDangerAlert('notifications', "Error: " + err);
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
                    redirect_to('/wallets/show');
                }catch(err){
                    return renderDangerAlert('notifications', 'Invalid password');
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
                renderDangerAlert('notifications', response.message);
            }
        },
        error: function(error){
            renderAjaxError('notifications', error);
        }
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
                    redirect_to('/wallets/show');
                }catch(err){
                    renderDangerAlert('notifications', 'Invalid password');
                }
            }else{
                if (response.require_2fa){
                    renderDangerAlert('notifications', 'Invalid authentication key. Try again');
                }else{
                    renderDangerAlert('notifications', response.message);
                }
            }
        },
        error: function(error){
            Ladda.stopAll();
            renderAjaxError('notifications', error);
        }
    });
}

function validateUserInput(username, password){
    if (!isValidPassword(password)){
        renderDangerAlert('notifications',
            "Your password must be at least " + window.minPasswordLength + " characters long");
        throw('Invalid input');
    }else if (!isValudUsername(username)){
        renderDangerAlert('notifications', 'Your username cannot be empty');
        throw('Invalid input');
    }else{
        renderWarningAlert('notifications',
            "<b>Important</b>: Remember to backup your credentials, including your seed. They cannot be recovered once they are lost!")
    }
}

function isValidPassword(password){
    return password.length >= window.minPasswordLength;
}

function isValudUsername(username){
    return username.length !== 0;
}