

async function getPaymentStatus(payment_id) {
    const pg_merchant_id = "538933";
    const secret_key = "YbKQc0mq9t9GB0fb";
    const url = "https://api.paybox.money/get_status.php";
    var md5 = require('md5');
    let request = [
        url.split('/').pop(),
        { pg_merchant_id: pg_merchant_id },
        { pg_payment_id: payment_id },
        { pg_salt: "LM9RhvtI3CNw3CoC" },

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
    request = request.filter(e => typeof e == 'object');
    request.push({ pg_sig: md5hash })
    console.log(request)


    const requestObj = {};


    request.forEach(obj => {
        requestObj[Object.keys(obj)] = obj[Object.keys(obj)]
    })


    // //POST ATMA

    const axios = require("axios");
    const res = await axios.default.get(url, {
        params: {
            ...requestObj
        }
    });

    var parser = require('xml2json');
    // xml to json
    var json = parser.toJson(res.data, { object: true });
    console.log(json)
    return json.response.pg_status == "ok";
}

console.log(await getPaymentStatus("483280965"))

