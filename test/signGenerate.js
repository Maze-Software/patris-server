const pg_merchant_id = "538933";
const secret_key = "0ZOznEKNn2CrNYLY";

var md5 = require('md5');

let request = [
    'init',
    { 'pg_amount': 100, },
    { 'pg_merchant_id': pg_merchant_id },

    { 'pg_order_id': 12345, },
    { 'pg_user_id': 1234, },
    { 'pg_card_id': 1234, },
    { 'pg_description': 'Описание платежа', },
    { 'pg_salt': 'some random string', },

];

request.sort(function (a, b) {
    var keyA = Object.keys(a)[0],
        keyB = Object.keys(b)[0];
    // Compare the 2 dates
    if (keyA < keyB) return -1;
    if (keyA > keyB) return 1;
    return 0;
});

request.push(secret_key)
const finish = request.map((e) => {
    if (typeof e == 'object') {
        return e[Object.keys(e)[0]]
    }
    else {
        return e
    }
});

//init;100;1234;Описание платежа;538933;12345;some random string;1234;0ZOznEKNn2CrNYLY
const md5hash = md5(finish.join(";"));

request = request.filter(e => typeof e == 'object');
request.push({ pg_sig: md5hash })
console.log(request)
console.log(md5hash);