/**
 * Created by Daniel on 12.06.2017.
 */

function getSenderAddress(bundle){
    for (var j = 0; j < bundle.length; j++){
        if (bundle[j].value < 0 || j >= bundle.length - 1){
            return bundle[j].address;
        }
    }
}