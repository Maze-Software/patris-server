const pg_merchant_id = "538933";
const secret_key = "YbKQc0mq9t9GB0fb";
const url = "https://api.paybox.money/init_payment.php";
var md5 = require('md5');
const order_id = Math.random().toString(36).substr(2, 9)
let request = [
    url.split('/').pop(),
    { pg_merchant_id: pg_merchant_id },
    { pg_amount: "20" },
    { pg_currency: "KGS" },
    { pg_description: "Deneme" },
    { pg_salt: "LM9RhvtI3CNw3CoC" },
    { pg_language: "en" },
    { pg_order_id: order_id }

];

request.sort(function (a, b) {
    var keyA = Object.keys(a)[0],
        keyB = Object.keys(b)[0];
    // Compare
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
console.log(md5hash)
request = request.filter(e => typeof e == 'object');
request.push({ pg_sig: md5hash })
console.log(request)


const requestObj = {};


request.forEach(obj => {
    requestObj[Object.keys(obj)] = obj[Object.keys(obj)]
})

console.log(requestObj)

// const urlRedirect = url  + "?" + new URLSearchParams(requestObj).toString();

// console.log(urlRedirect);


// //POST ATMA

const axios = require("axios");
//https://api.paybox.money/payment.php?pg_merchant_id=538933&pg_amount=20&pg_currency=KGS&pg_description=Deneme&pg_salt=LM9RhvtI3CNw3CoC&pg_language=en&pg_sig=ba492fb3b52423156d073aa37dbdc8b2
const res = await axios.default.get(url, {
    // ...requestObj
    params: {
        ...requestObj
    }
});
console.log(res.data)
var parser = require('xml2json');
// xml to json
var json = parser.toJson(res.data, { object: true });
console.log(json);
const cutomer_id = json.response.pg_redirect_url.split("/").pop().substring(18)
