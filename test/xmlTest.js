const axios = require("axios");

const res = await axios.default.post("https://api.paybox.money/init_payment.php", {

});

console.log(res.data)

var parser = require('xml2json');


// xml to json
var json = parser.toJson(res.data, { object: true });
console.log(json);
console.log(json)