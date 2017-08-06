
/**
*   Converts trytes into trits
*
*   @method trits
*   @param {String|Int} input Tryte value to be converted. Can either be string or int
*   @param {Array} state (optional) state to be modified
*   @returns {Array} trits
**/
var trits = function(input, state) {

    var trits = state || [];

    if (Number.isInteger(input)) {

        var absoluteValue = input < 0 ? -input : input;

        while (absoluteValue > 0) {

            var remainder = absoluteValue % 3;
            absoluteValue = Math.floor(absoluteValue / 3);

            if (remainder > 1) {
                remainder = -1;
                absoluteValue++;
            }

            trits[trits.length] = remainder;
        }
        if (input < 0) {

            for (var i = 0; i < trits.length; i++) {

                trits[i] = -trits[i];
            }
        }
    } else {

        for (var i = 0; i < input.length; i++) {

            var index = window.trytesAlphabet.indexOf(input.charAt(i));
            trits[i * 3] = window.trytesTrits[index][0];
            trits[i * 3 + 1] = window.trytesTrits[index][1];
            trits[i * 3 + 2] = window.trytesTrits[index][2];
        }
    }

    return trits;
};

/**
*   Converts trits into trytes
*
*   @method trytes
*   @param {Array} trits
*   @returns {String} trytes
**/
var trytes = function(trits) {

    var trytes = "";

    for (var i = 0; i < trits.length; i += 3) {

        // Iterate over all possible tryte values to find correct trit representation
        for (var j = 0; j < window.trytesAlphabet.length; j++) {

            if (window.trytesTrits[j][0] == trits[i] && window.trytesTrits[j][1] == trits[i + 1] && window.trytesTrits[j][2] == trits[i + 2]) {

                trytes += window.trytesAlphabet.charAt(j);
                break;
            }
        }
    }

    return trytes;
};

/**
*   Converts trits into an integer value
*
*   @method value
*   @param {Array} trits
*   @returns {String} trytes
**/
var toValue = function(trits) {

    var value = 0;

    for (var i = trits.length; i-- > 0; ) {

        value = value * 3 + trits[i];
    }

    return value;
};


/**
*   Converts  an integer value into trits
*
*   @method fromValue
*   @param {Number} value
*   @returns {Array} trits
**/
var fromValue= function(value) {
    var destination = [];
    var absoluteValue = value < 0 ? -value : value;
    var i = 0;
    while(absoluteValue > 0) {
        var remainder = (absoluteValue % window.RADIX);
        absoluteValue = Math.floor(absoluteValue / window.RADIX);
        if (remainder > window.MAX_TRIT_VALUE) {

            remainder = window.MIN_TRIT_VALUE;
            absoluteValue++;
        }
        destination[i] = remainder;
        i++;
    }
    if (value < 0) {
        for (var i = 0; i < destination.length; i++) {
            destination[i] = destination[i] == 0? 0: -destination[i];
        }
    }
    return destination;
};