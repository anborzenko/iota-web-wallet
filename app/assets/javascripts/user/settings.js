/**
 * Created by Daniel on 16.07.2017.
 */

function saveSettings(){
    var pwd_confirmation = $('#settings_pwd').val();
    validateConfirmationPassword(pwd_confirmation);

    var data = {};

    var tfaInput = document.getElementById('settings_2fa_toggle');
    if (tfaInput.defaultChecked !== tfaInput.checked){
        data['has2fa'] = tfaInput.checked;
        data['has_confirmed_2fa'] = false;
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

            updateSession(data);
            if (data['has2fa']){
                // Enabling 2fa requires the user to confirm the code. This is easiest accomplished by logging back in.
                renderSuccessAlert('user_show_notification',
                    'Update was successful. Please log back in to complete the process');
            }else{
                redirect_to('/users/show', 'success=' + btoa('Update was successful'));
            }
        },
        error: function(err) {
            renderAjaxError('user_show_notification', err);
        }
    });
}

function renderFailureNotification(response){
    if (response.require_2fa) {
        renderDangerAlert('user_show_notification', 'Invalid two-factor key. Try again');
    }else if(!response.success){
        renderDangerAlert('user_show_notification', response.message);
    }
}

function validateConfirmationPassword (pwd_confirmation){
    if (!pwd_confirmation || hashPassword(pwd_confirmation, getUsername()) !== getPasswordHash()) {
        renderDangerAlert('user_show_notification', 'Invalid password');
        throw 'Invalid password';
    }
}