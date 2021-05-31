// pm.environment.set("paybox_signature", makeSignature());

const request = {
    url: "https://api.paybox.money/payment.php",
    body: {
        pg_merchant_id: 538933,
        pg_amount: 20,
        pg_currency: "KGS",
        pg_description: "Deneme",
        pg_salt: "LM9RhvtI3CNw3CoC",
        pg_language: "en",
    }
}

console.log(makeSignature())

/**
 * Возвращает сгенерированную подпись
 */
function makeSignature() {
    var methodName = getMethodName();
    var requestFields = getFields();
    var secretKey = getSecretKey(methodName);
    var signature = [methodName];
    // Сортировка по алфавиту
    Object.keys(requestFields).sort().forEach(function (key) {
        if (key != 'pg_sig') {
            signature.push(getValue(requestFields[key]));
        }
    });

    string = signature.join(';') + ';' + secretKey;
    signature = CryptoJS.MD5(string).toString();

    console.log('Make sign from', string);

    return signature;
}

/**
 * Возвращает имя метода
 */
function getMethodName() {
    return request.url.split('?').shift().split('/').pop();
}

/**
 * Возвращает все поля запроса в ввиде объекта
 */
function getFields() {
    var result = {};
    var paramsFromUrl = request.url.split('?')[1];
    var paramsFromBody = request.body;

    // Парсинг полей из адресной строки
    if (paramsFromUrl) {
        var eachParamArray = paramsFromUrl.split('&');

        eachParamArray.forEach((param) => {
            let key = param.split('=')[0];
            let value = param.split('=')[1];

            Object.assign(result, { [key]: value });
        });

        // Парсинг полей из тела запроса
    } else {
        Object.keys(paramsFromBody).forEach((param) => {
            if (param.disabled === true) return;

            let key = param;
            let value = paramsFromBody[key];


            if (key == 'pg_xml') {
                let xml = xml2Json(value);

                Object.keys(xml.request).sort().forEach(function (xmlKey) {
                    Object.assign(result, { [xmlKey]: xml.request[xmlKey] });
                });
            } else {
                Object.assign(result, { [key]: value });
            }
        });
    }

    return result;
}

/**
 * Возвращает секретный ключ
 */
function getSecretKey(methodName) {
    var secretKey = '0ZOznEKNn2CrNYLY';
    var payoutSecretKey = '0ZOznEKNn2CrNYLY';
    var payoutMethods = ['reg2reg', 'reg2nonreg', 'payment_status', 'p2p', 'p2p_secure', 'p2p2nonreg', 'p2p2nonreg_foreign'];

    if (payoutMethods.indexOf(methodName) + 1) {
        secretKey = payoutSecretKey;
    }

    return getValue(secretKey);
}

/**
 * Возвращает значение переменной
 * если value является названием переменной
 */
function getValue(value) {
    // value = value.trim();
    console.log(value)
    var len = value.length;
    var paramLikeVariable = value.substring(0, 2) == '{{' && value.substring(len - 2) == '}}';

    if (paramLikeVariable) {
        var variableName = value.substring(2, len - 2).trim();


    }

    return value;
}