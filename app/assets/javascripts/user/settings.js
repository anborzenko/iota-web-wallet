/**
 * Created by Daniel on 16.07.2017.
 */

function saveSettings(){
    var pwd_confirmation = $('#settings_pwd').val();
    validateConfirmationPassword(pwd_confirmation);

    var new_username = $('#settings_username').val();

    var data = {};

    if (new_username.length !== 0 && new_username !== getUsername()) {
        // Is trying to change username
        data['username'] = new_username;
    }

    if (getDictKeys(data).length === 0) {
        // Nothing has been changed
        return renderInfoAlert('user_show_notification', 'No changes has been made');
    }

    data['otp_key'] = $('#settings_otp_key').val() || '';

    $.ajax({
        type: "POST",
        url: 'update',
        data: data,
        dataType: "JSON",
        success: function(response) {
            if (!response.success){
                return renderFailureNotification(response);
            }

            redirect_to('show', 'success=' + atob('Update was successful'));
        },
        error: function(err) {
            renderAjaxError('user_show_notification', err);
        }
    });
}

function onDeleteAccountClick(){
    if (getSeedBalance() > 0){
        return renderDangerAlert('user_show_notification',
            'Your balance is larger than 0. Please move all your funds to a new seed before deleting your account');
    }

    $('#delete_account_group').hide();
    $('#delete_account_confirmation_group').show();
}

function onDeleteAccountConfirmation(btn){
    var l = Ladda.create(btn);
    l.start();

    var pwd_confirmation = $('#advanced_pwd').val();
    validateConfirmationPassword(pwd_confirmation);
    try {
        loadSeedBalance(function(balance){
            if (balance > 0){
                l.stop();
                return renderDangerAlert('user_show_notification',
                    'Your balance is larger than 0. Please move all your funds to a new seed before deleting your account');
            }
            deleteAccount();
        });
    }catch(err){
        l.stop();
        renderFailureNotification(err);
    }
}

function deleteAccount(btn){
    var l = Ladda.create(btn);
    l.start();

    var otp_key = $('#advanced_otp_key').val() || '';

    $.ajax({
        type: "POST",
        url: 'delete',
        data: {otp_key: otp_key},
        dataType: "JSON",
        success: function (response) {
            Ladda.stopAll();

            if (!response.success) {
                return renderFailureNotification(response);
            }

            renderSuccessAlert('user_show_notification', 'Your account has been deleted. Redirecting in 5 seconds');

            setTimeout(function () {
                logOut();
            }, 5000)
        },
        error: function (err) {
            Ladda.stopAll();
            renderAjaxError('user_show_notification', err);
        }
    });
}

function onAbortDeletionClick(){
    $('#delete_account_confirmation_group').hide();
    $('#delete_account_group').show();
}

function renderFailureNotification(response){
    if (response.require_2fa) {
        renderDangerAlert('user_show_notification', 'Invalid two-factor key. Try again');
    }else if(!response.success){
        renderDangerAlert('user_show_notification', response.message);
    }
}

function onEnable2faClick(btn){
    var l = Ladda.create(btn);
    l.start();

    validateConfirmationPassword($('#settings_pwd').val());
    var otp_key = $('#settings_otp_key').val() || '';

    $.ajax({
        type: "POST",
        url: 'update',
        data: {otp_key: otp_key, 'has2fa': true, 'has_confirmed_2fa': false},
        dataType: "JSON",
        success: function (response) {
            Ladda.stopAll();

            if (!response.success) {
                return renderFailureNotification(response);
            }

            renderSuccessAlert('user_show_notification',
                'Two-factor authentications has been enabled. Please log back in to complete the process');
        },
        error: function (err) {
            Ladda.stopAll();
            renderAjaxError('user_show_notification', err);
        }
    });
}

function onDisable2faClick(btn){
    var l = Ladda.create(btn);
    l.start();

    validateConfirmationPassword($('#settings_pwd').val());
    var otp_key = $('#settings_otp_key').val() || '';

    $.ajax({
        type: "POST",
        url: 'update',
        data: {otp_key: otp_key, 'has2fa': false, 'has_confirmed_2fa': false},
        dataType: "JSON",
        success: function (response) {
            Ladda.stopAll();

            if (!response.success) {
                return renderFailureNotification(response);
            }

            redirect_to('show', 'success=' + atob('Two-factor authentication has been disabled'));
        },
        error: function (err) {
            Ladda.stopAll();
            renderAjaxError('user_show_notification', err);
        }
    });
}

function validateConfirmationPassword (pwd_confirmation){
    if (!pwd_confirmation || hashPassword(pwd_confirmation) !== getPasswordHash()) {
        Ladda.stopAll();
        renderDangerAlert('user_show_notification', 'Invalid password');
        throw 'Invalid password';
    }
}