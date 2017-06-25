/**
 * Created by Daniel on 24.06.2017.
 */

function check_seed(){
    var seed = $("#seed_input").val();
    var secLevel = parseInt($("#sec_level").val());
    if (seed.length === 0){
        return document.getElementById('seed_checker_notifications').innerHTML = "<div class='alert alert-danger'>Invalid seed</div>";
    }
    document.getElementById('seed_checker_notifications').innerHTML = '';

    $("#loading").spin(true);
    $(document).find('#loading').show();
    $(document).find('#addresses_div').hide();
    $(document).find('#seed_checker_result').hide();

    setTimeout(function () {
        var total = 200;
        iota.api.getNewAddress(seed, {'index': 0, 'total': total, 'security': secLevel}, function (_, addresses) {
            window.iota.api.getBalances(addresses, 100, function (error, res) {
                $("#loading").spin(false);
                $(document).find('#loading').hide();
                $(document).find('#addresses_div').show();
                $(document).find('#seed_checker_result').show();

                if (error) {
                    return document.getElementById('seed_checker_notifications').innerHTML = "<div class='alert alert-danger'>Something went wrong: " + e + "</div>";
                }

                var totalBalance = 0;

                var table = document.getElementById('address_list');
                table.innerHTML = '';
                for (var i = 0; i < res.balances.length; i++) {
                    totalBalance += parseInt(res.balances[i]);

                    var a = addresses[i];
                    var b = res.balances[i];

                    var row = table.insertRow(-1);
                    var address = row.insertCell(0);
                    var balance = row.insertCell(1);
                    address.innerHTML = a;
                    balance.innerHTML = b;
                }

                document.getElementById('seed_checker_result').innerHTML = 'Searched ' + total + ' addresses. Found a total balance of ' + totalBalance.toString();
            })
        })
    }, 50);

}