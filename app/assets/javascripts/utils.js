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

function sumDictValues(dict){
    var sum = 0;
    for (var key in dict){
        sum += dict[key];
    }
    return sum;
}

function sumList(list){
    var sum = 0;
    for (var i = 0; i < list.length; i++){
        sum += parseInt(list[i]);
    }
    return sum;
}

function getCookie(name){
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
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