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
