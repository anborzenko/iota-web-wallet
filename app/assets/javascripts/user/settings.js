/**
 * Created by Daniel on 16.07.2017.
 */

function saveSettings(){
    var curr_pass_hash = getPasswordHash();
    if (hashPassword($('#settings_pwd').val()) !== curr_pass_hash) {
        return renderDangerAlert('user_show_notification', 'Invalid confirmation password')
    }

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

            redirect_to('show', 'updated=true');
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

    $('#delete_account_confirmation_group').show();
}

function onDeleteAccountConfirmation(){
    if (getSeedBalance() > 0){
        return renderDangerAlert('user_show_notification',
            'Your balance is larger than 0. Please move all your funds to a new seed before deleting your account');
    }

    if (hashPassword($('advanced_pwd').val()) !== getPasswordHash()){
        return renderDangerAlert('user_show_notification', 'Invalid password');
    }

    var otp_key = $('#advanced_otp_key').val() || '';

    $.ajax({
        type: "POST",
        url: 'delete',
        data: {otp_key: otp_key},
        dataType: "JSON",
        success: function(response) {
            if (!response.success){
                return renderFailureNotification(response);
            }

            renderSuccessAlert('user_show_notification', 'Your account has been deleted. Redirecting in 5 seconds');
            logOut();

            setTimeout(function () {
                redirect_to('/');
            }, 5000)
        },
        error: function(err) {
            renderAjaxError('user_show_notification', err);
        }
    });
}

function onAbortDeletionClick(){
    $('#delete_account_confirmation_group').hide();
}

function renderFailureNotification(response){
    if (response.require_2fa) {
        renderDangerAlert('user_show_notification', 'Invalid two-factor key. Try again');
    }else if(!response.success){
        renderDangerAlert('user_show_notification', response.message);
    }
}

function onEnable2faClick(){

}

function onDisable2faClick(){

}

function validateNewUserInput(username, password){
    if (!isValidPassword(password)){
        renderDangerAlert('user_show_notification',
            "Your password must be at least " + window.minPasswordLength + " characters long");
        throw('Invalid input');
    }else if (!isValudUsername(username)){
        renderDangerAlert('user_show_notification', 'Your username cannot be empty');
        throw('Invalid input');
    }
}
