/**
 * Created by Daniel on 04.06.2017.
 */

function openWithSeed() {
    const seed = $('#wallet_seed').val();
    if (seed.length === 0 || !validateSeed(seed)){
        document.getElementById('notifications').innerHTML = "<div class='alert alert-danger'>Error: Invalid seed</div>"; // TODO: Instructions about what is valid.
        return;
    }

    cacheSeed('seed', seed);
    document.location.href = 'show';
}

function signup() {
    // TODO: Make the button spin

    let username = $('#wallet_username').val();
    let password = $('#wallet_password').val();
    validateUserInput(username, password);

    let seed = generateRandomSeed();
    let encryptedSeed = encrypt(password, seed);

    $.ajax({
        type: "GET",
        url: 'signup',
        data: {'username': username, 'encrypted_seed': encryptedSeed},
        dataType: "JSON",
        success: function (response) {
            if (response.success){
                cacheSeed('seed', seed);
                document.location.href = 'show';
            }else{
                document.getElementById('notifications').innerHTML = "<div class='alert alert-danger'>" + response.message + "</div>";
            }
        },
    });
}

function login () {
    let username = $('#wallet_username').val();
    let password = $('#wallet_password').val();
    validateUserInput(username, password);

    $.ajax({
        type: "GET",
        url: 'login',
        data: {'username': username},
        dataType: "JSON",
        success: function (response) {
            if (response.success){
                let seed;
                try{
                    seed = decrypt(password, response.encrypted_seed);
                    cacheSeed(seed);
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
    alert('dws');
    deleteSeed();
    window.location = '/';
}

function validateUserInput(username, password){
    if (username.length === 0 || password.length === 0){// TODO: Restrict password length more
        document.getElementById('notifications').innerHTML = "<div class='alert alert-danger'>Username and password cannot be empty</div>";
        throw('Invalid input');
    }else{
        document.getElementById('notifications').innerHTML = "<div class='alert alert-warning'>Important: Remember to backup your credentials. They cannot be recovered once they are lost!</div>";
    }
}