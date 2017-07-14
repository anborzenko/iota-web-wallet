/**
 * Created by dl6764 on 14.07.2017.
 */

function renderDangerAlert(elem_id, message){
    _renderAlert('danger', elem_id, message);
}

function renderWarningAlert(elem_id, message){
    _renderAlert('warning', elem_id, message);
}

function renderSuccessAlert(elem_id, message){
    _renderAlert('success', elem_id, message);
}

function renderInfoAlert(elem_id, message){
    _renderAlert('info', elem_id, message);
}

function _renderAlert(type, elem_id, message){
    document.getElementById(elem_id).innerHTML = "<div class='alert alert-" + type + "'>" + message + "</div>";
}

function removeAlert(elem_id){
    document.getElementById(elem_id).innerHTML = '';
}