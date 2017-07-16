/**
 * Created by Daniel on 02.07.2017.
 */

function redirect_to(location, options){
    if(options){
        location += '?' + options;
    }
    document.location.href = location;
}

function getParam(id){
    if (document.location.href.indexOf(id) === -1){
        return null;
    }

    try {
        var params = document.location.href.split('?')[1].split('&');
        for (var i = 0; i < params.length; i++) {
            var s = params[i].split('=');
            if (s[0] === id) {
                return s[1];
            }
        }
    }catch(err){}

    return null;
}