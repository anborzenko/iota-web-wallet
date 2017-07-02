/**
 * Created by Daniel on 02.07.2017.
 */

function redirect_to(location, keep_options=true){
    if(keep_options && document.location.href.indexOf('?') !== -1){
        location += '?' +  document.location.href.split('?')[1];
    }
    document.location.href = location;
}
