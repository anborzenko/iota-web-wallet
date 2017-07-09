/**
 * Created by Daniel on 12.06.2017.
 */

function arrayCopy(src, src_start, dst, dst_start, len){
    for (var i = src_start; i < src_start + len; i++){
        dst[dst_start + (i - src_start)] = src[i];
    }
}

function isInArray(array, elem, comparer){
    for (var i = 0; i < array.length; i++){
        if (comparer(elem, array[i])){
            return true;
        }
    }
    return false;
}

function getArrayIndex(array, elem, comparer){
    for (var i = 0; i < array.length; i++){
        if (comparer(elem, array[i])){
            return i;
        }
    }
    return -1;
}

function removeIndexes(list, indexes){
    indexes = indexes.sort(sortNumber).reverse();
    for (var i = 0; i < indexes.length; i++){
        list.splice(indexes[i], 1);
    }
    return list;
}

function sortNumber(a,b) {
    return a - b;
}

function sortTx(a, b){
    return a.currentIndex === b.currentIndex ? a.hash > b.hash : a.currentIndex - b.currentIndex;
}

function getDictValues(dict){
    var values = [];
    for (var key in dict){
        values.push(dict[key]);
    }
    return values;
}

function getDictKeys(dict){
    var keys = [];
    for(var key in dict){
        keys.push(key);
    }
    return keys;
}

function sumList(list){
    var sum = 0;
    for (var i = 0; i < list.length; i++){
        sum += parseInt(list[i]);
    }
    return sum;
}

function findMin(iterable){
    var min = iterable[0];
    for (var i = 1; i < iterable.length; i++){
        if (iterable[i] < min){
            min = iterable[i];
        }
    }
    return min;
}

function getStringHash(string){
    var hash = 0, i, chr;
    if (string.length === 0) return hash;
    for (i = 0; i < string.length; i++) {
        chr   = string.charCodeAt(i);
        hash  = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

function dictHasKeys(dict){
    for (var key in dict) {
        if (dict.hasOwnProperty(key)) {
            return true;
        }
    }
    return false;
}

function dictToString(dict){
    var string = '';
    for (var key in dict) {
        if (dict.hasOwnProperty(key)) {
            string += (string.length === 0 ? '' : ';') + key + ',' + dict[key];
        }
    }

    return string;
}

function numberWithSpaces(x) {
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

function dictFromString(string){
    var dict = {};
    var entries = string.split(';');
    for (var i = 0; i < entries.length; i++) {
        var keyvalue = entries[i].split(',');
        dict[parseInt(keyvalue[0])] = keyvalue[1];
    }

    return dict;
}

// Merges common elements in the list into single lists. Returns a list of lists
function mergeCommon(list, comparer){
    var merged = [];
    for (var i = 0; i < list.length; i++){
        var isAdded = false;
        for (var j = 0; j < merged.length; j++){
            if (isInArray(merged[j], list[i], comparer)){
                isAdded = true;
                merged[j].push(list[i]);
                break;
            }
        }
        if (!isAdded) {
            merged.push([list[i]]);
        }
    }

    return merged;
}

function getUnique(list, comparer){
    var unique = [];
    for (var i = 0; i < list.length; i++){
        if (!isInArray(unique, list[i], comparer)){
            unique.push(list[i]);
        }
    }

    return unique;
}

// Counts the number of occurrences of a item in a list given a comparer
function count(item, list, comparer){
    var c = 0;
    for (var i = 0; i < list.length; i++){
        if (comparer(list[i], item)){
            c++;
        }
    }
    return c;
}