/**
 * Created by dl6764 on 19.07.2017.
 */
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

function onGenerateSeedClick() {
    var seed = generateRandomSeed();
    $('#wallet_seed').val(seed);
}
