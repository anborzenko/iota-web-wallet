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
                $('#loginModal').modal('hide');
                $('#requireOneTimeProofModal').modal('show');
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
    }else if (!isValidUsername(username)){
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

function isValidUsername(username){
    return username.length !== 0;
}

function onDisapproveOneTimeProof(btn){
    var username = $('#wallet_username').val();
    var password = $('#wallet_password').val();

    var l = Ladda.create(btn);
    l.start();

    $.ajax({
        type: "GET",
        url: 'login_without_proof',
        data: { 'username': username },
        dataType: "JSON",
        success: function (response) {
            Ladda.stopAll();
            if (response.success){
                try{
                    var seed = decrypt(password, response.encrypted_seed);
                    saveLogin(seed, password, username);
                    redirect_to('/wallets/show');
                }catch(err){
                    renderDangerAlert('oneTimeProofNotifications', 'Invalid password');
                }
            }else{
                renderDangerAlert('oneTimeProofNotifications', response.message);
            }
        },
        error: function(error){
            Ladda.stopAll();
            renderAjaxError('oneTimeProofNotifications', error);
        }
    });
}