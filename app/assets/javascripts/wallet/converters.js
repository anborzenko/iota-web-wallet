/**
 * Created by Daniel on 10.06.2017.
 */

var RADIX = 3;
var MAX_TRIT_VALUE = (RADIX - 1) / 2, MIN_TRIT_VALUE = -MAX_TRIT_VALUE;
var NUMBER_OF_TRITS_IN_A_TRYTE = 3;
var NUMBER_OF_TRITS_IN_A_BYTE = 5;
var TRYTE_TO_TRITS_MAPPINGS = null;
var BYTE_TO_TRITS_MAPPINGS = null;
var TRYTE_ALPHABET = "9ABCDEFGHIJKLMNOPQRSTUVWXYZ";
var HASH_LENGTH = 243;

function converterInit() {
    if (TRYTE_TO_TRITS_MAPPINGS !== null && BYTE_TO_TRITS_MAPPINGS !== null){
        return;
    }
    var trits = createArray(NUMBER_OF_TRITS_IN_A_BYTE, 0);

    BYTE_TO_TRITS_MAPPINGS = new Array(243);
    for (var i = 0; i < 243; i++) {
        BYTE_TO_TRITS_MAPPINGS[i] = copyOf(trits, NUMBER_OF_TRITS_IN_A_BYTE);
        increment(trits, NUMBER_OF_TRITS_IN_A_BYTE);
    }

    TRYTE_TO_TRITS_MAPPINGS = new Array(27);
    for (i = 0; i < 27; i++) {
        TRYTE_TO_TRITS_MAPPINGS[i] = copyOf(trits, NUMBER_OF_TRITS_IN_A_TRYTE);
        increment(trits, NUMBER_OF_TRITS_IN_A_TRYTE);
    }
}

function toTrytes(trits, offset, size) {
    var trytes = '';
    for (var i = 0; i < (size + NUMBER_OF_TRITS_IN_A_TRYTE - 1) / NUMBER_OF_TRITS_IN_A_TRYTE; i++) {
        var j = trits[offset + i * 3] + trits[offset + i * 3 + 1] * 3 + trits[offset + i * 3 + 2] * 9;
        if (j < 0) {
            j += TRYTE_ALPHABET.length;
        }

        trytes += TRYTE_ALPHABET.charAt(j);
    }
    return trytes;
}

function toTrits(trytes) {
    var trits = createArray(trytes.length * NUMBER_OF_TRITS_IN_A_TRYTE, 0);
    for (var i = 0; i < trytes.length; i++) {
        arrayCopy(TRYTE_TO_TRITS_MAPPINGS[TRYTE_ALPHABET.indexOf(trytes.charAt(i))], 0, trits, i * NUMBER_OF_TRITS_IN_A_TRYTE, NUMBER_OF_TRITS_IN_A_TRYTE);
    }

    return trits;
}

function hashToTrits(hash) {
    var trits = createArray(HASH_LENGTH, 0);
    getTrits(hash, trits);
    return trits;
}

function getTrits(bytes, trits) {
    var offset = 0;
    for (var i = 0; i < bytes.length && offset < trits.length; i++) {
        arrayCopy(BYTE_TO_TRITS_MAPPINGS[bytes[i] < 0 ? (bytes[i] + BYTE_TO_TRITS_MAPPINGS.length) : bytes[i]], 0,
            trits, offset, trits.length - offset < NUMBER_OF_TRITS_IN_A_BYTE ? (trits.length - offset) : NUMBER_OF_TRITS_IN_A_BYTE);
        offset += NUMBER_OF_TRITS_IN_A_BYTE;
    }
    while (offset < trits.length) {
        trits[offset++] = 0;
    }
}

function asciiToTrytes(input) {
    var sb = '';
    for (var i = 0; i < input.length; i++) {
        var asciiValue = input.charCodeAt(i);
        // If not recognizable ASCII character, return null
        if (asciiValue > 255) {
            return null;
        }
        var firstValue = asciiValue % 27;
        var secondValue = (asciiValue - firstValue) / 27;
        sb += TRYTE_ALPHABET.charAt(firstValue);
        sb += TRYTE_ALPHABET.charAt(secondValue);
    }
    return sb;
}

function increment(trits, size) {
    for (var i = 0; i < size; i++) {
        if (++trits[i] > MAX_TRIT_VALUE) {
            trits[i] = MIN_TRIT_VALUE;
        } else {
            break;
        }
    }
    return trits;
}

function copyOf(a, num){
    var res = new Array(num);
    for (var i = 0; i < num && i < a.length; i++){
        res[i] = a[i];
    }

    return res;
}

function arrayCopy(src, src_start, dst, dst_start, len){
    for (var i = src_start; i < src_start + len; i++){
        dst[dst_start + (i - src_start)] = src[i];
    }
}

function createArray(len, default_value){
    var array = new Array(len);
    for (var i = 0; i < len; i++){
        array[i] = default_value;
    }
    return array;
}

