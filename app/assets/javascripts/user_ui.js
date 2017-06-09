/**
 * Created by Daniel on 04.06.2017.
 */

function openWithSeed() {
    const seed = $('#wallet_seed').val();
    if (seed.length === 0 || !validateSeed(seed)){
        document.getElementById('notifications').innerHTML = "<div class='alert alert-danger'>Error: Invalid seed</div>";
        return;
    }

    saveSeed(seed, generateRandomSeed());
    document.location.href = 'show';
}

function signup(btn) {
    var username = $('#wallet_username').val();
    var password = $('#wallet_password').val();
    validateUserInput(username, password);

    var l = Ladda.create(btn);
    l.start();
    try {
        var seed = generateRandomSeed();
        var encryptedSeed = encrypt(password, seed);
    }catch(err){
        return document.getElementById('notifications').innerHTML = "<div class='alert alert-danger'>" + err + "</div>";
    }

    $.ajax({
        type: "GET",
        url: 'signup',
        data: {'username': username, 'encrypted_seed': encryptedSeed},
        dataType: "JSON",
        success: function (response) {
            Ladda.stopAll();
            if (response.success){
                saveSeed(seed, password);
                document.location.href = 'show';
            }else{
                document.getElementById('notifications').innerHTML = "<div class='alert alert-danger'>" + response.message + "</div>";
            }
        },
    });
}

function login (btn) {
    var username = $('#wallet_username').val();
    var password = $('#wallet_password').val();
    validateUserInput(username, password);

    var l = Ladda.create(btn);
    l.start();
    $.ajax({
        type: "GET",
        url: 'login',
        data: {'username': username},
        dataType: "JSON",
        success: function (response) {
            Ladda.stopAll();
            if (response.success){
                var seed;
                try{
                    seed = decrypt(password, response.encrypted_seed);
                    saveSeed(seed);
                    document.location.href = 'show';
                }catch(err){
                    document.getElementById('notifications').innerHTML = "<div class='alert alert-danger'>Invalid password</div>";
                }
            }else{
                document.getElementById('notifications').innerHTML = "<div class='alert alert-danger'>" + response.message + "</div>";
            }
        },
    });
}

function signout(){
    deleteSeed();
    window.location = '/';
}

function validateUserInput(username, password){
    var minPasswordLength = 8;

    if (password.length < minPasswordLength){
        document.getElementById('notifications').innerHTML = "<div class='alert alert-danger'>Password must be at least " + minPasswordLength + " characters long</div>";
        throw('Invalid input');
    }else if (username.length === 0){
        document.getElementById('notifications').innerHTML = "<div class='alert alert-danger'>Username cannot be empty</div>";
        throw('Invalid input');
    }else{
        document.getElementById('notifications').innerHTML = "<div class='alert alert-warning'>Important: Remember to backup your credentials. They cannot be recovered once they are lost!</div>";
    }
}