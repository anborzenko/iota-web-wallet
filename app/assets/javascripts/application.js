// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, or any plugin's
// vendor/assets/javascripts directory can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file. JavaScript code in this file should be added after the last require_* statement.
//
// Read Sprockets README (https://github.com/rails/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require jquery
//= require jquery_ujs
//= require rails-ujs
//= require turbolinks
//= require clipboard
//= require spin
//= require jquery.spin
//= require "ladda"
//= require bootstrap-sprockets
//= require_tree .
//= stub "vendor/iota.min"
//= stub "vendor/curl.min"
//= stub "vendor/sjcl"


function loadGlobal(){
    // The asset preprocessing in rails don't allow global variables, so
    // have to attach them to window
    window.loadingTimeout = 10000;
    window.numAddressesToSaveOnServer = 10;
    window.minPasswordLength = 8;

    window.iota = new window.IOTA({
        'provider': 'https://d3j4w674fijhi2.cloudfront.net'
    });

    window.depth = 4;
    window.minWeightMagnitude = 15;
    window.nodeInfo = null;
    window.walletData = {
        'latestAddress'         : '',
        'addresses'             : [],
        'transfers'             : [],
        'inputs'                : [],
        'generatedIndexes'      : {}
    };
    window.defaultNumAddessesToLoad = 30;
    window.openTail = null;

    window.units = ['i', 'Ki', 'Mi', 'Gi', 'Ti', 'Pi'];
    window.RADIX = 3;
    window.MAX_TRIT_VALUE = 1;
    window.MIN_TRIT_VALUE = -1;

    // All possible tryte values
    window.trytesAlphabet = "9ABCDEFGHIJKLMNOPQRSTUVWXYZ";

    // map of all trits representations
    window.trytesTrits = [
        [ 0,  0,  0],
        [ 1,  0,  0],
        [-1,  1,  0],
        [ 0,  1,  0],
        [ 1,  1,  0],
        [-1, -1,  1],
        [ 0, -1,  1],
        [ 1, -1,  1],
        [-1,  0,  1],
        [ 0,  0,  1],
        [ 1,  0,  1],
        [-1,  1,  1],
        [ 0,  1,  1],
        [ 1,  1,  1],
        [-1, -1, -1],
        [ 0, -1, -1],
        [ 1, -1, -1],
        [-1,  0, -1],
        [ 0,  0, -1],
        [ 1,  0, -1],
        [-1,  1, -1],
        [ 0,  1, -1],
        [ 1,  1, -1],
        [-1, -1,  0],
        [ 0, -1,  0],
        [ 1, -1,  0],
        [-1,  0,  0]
    ];

    window.TRUNK_TRANSACTION_TRINARY_OFFSET = 7290;
    window.TRUNK_TRANSACTION_TRINARY_SIZE = 243;
    window.BRANCH_TRANSACTION_TRINARY_OFFSET = 7533;
    window.BRANCH_TRANSACTION_TRINARY_SIZE = 243;

    window.iotaDonationAddress = 'PRADUTNZ99BATVWNMCEHTUXATWVLTPVCQQBJYDIAHPQDAQDDQELWKS9PLHTCLNJYVB9ENJAINLQWOFVLXTHAHMKKFF';
}