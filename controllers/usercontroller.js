const { param, use } = require('../routes/RegisterUser');
const User = require('../Schemas/User');
const Admins = require('../Schemas/Admins');
var validator = require('validator');
const errorHandler = require('./ErrorHandler');
const { checkMissingParams, checkLogin } = require('./General');
const bcrypt = require('bcryptjs');
const config = require('../config.json');
var jwt = require('jsonwebtoken');
const { request } = require('express');
const Category = require("../Schemas/Category");
const Video = require('../Schemas/Videos');
const VideoPart = require('../Schemas/VideoParts');
const WatchedInfo = require('../Schemas/WatchedInfo');
var nodemailer = require('nodemailer');
const ErrorHandler = require('./ErrorHandler');
const { schema, count } = require('../Schemas/User');
const Payments = require('../Schemas/Payments');
var Iyzipay = require('iyzipay');
const Prices = require('../Schemas/Prices');
const ScreenShot = require('../Schemas/ScreenShots');
var iyzipay = new Iyzipay(config.iyziCo);



function firstNameValidator(firstName, res) {
    const length = validator.isByteLength(firstName, { min: 2, max: 20 }) // length should be between 4 and 10
    const regex = validator.matches(firstName, /^[a-zA-Z0-9ğüşöçİıĞÜŞÖÇ]+$/g); // should contains at least 1 char (letter)
    if (!length) new errorHandler(res, 500, 4);
    if (!regex) new errorHandler(res, 500, 5);
    return length && regex;
}

function lastNameValidator(lastName, res) {
    const length = validator.isByteLength(lastName, { min: 2, max: 20 }) // length should be between 4 and 10
    const regex = validator.matches(lastName, /^[a-zA-Z0-9ğüşöçİıĞÜŞÖÇ]+$/g); // should contains at least 1 char (letter)
    if (!length) new errorHandler(res, 500, 6);
    if (!regex) new errorHandler(res, 500, 7);
    return length && regex;
}
function passwordValidator(password, res) {
    const regex = validator.matches(password, /^(?=.*\d)(?=.*[a-z])(?=.*[a-zA-Z]).{8,25}$/g)
    if (!regex) new errorHandler(res, 500, 8);
    return regex;
}
async function emailValidator(email, res) {
    const isEmail = validator.isEmail(email);
    const already = await isEmailAlready(email);

    if (already) new errorHandler(res, 500, 10);
    if (!isEmail) new errorHandler(res, 500, 11);


    return !already && isEmail


}
function CapitalizeString(string) {
    return string.charAt(0).toUpperCase() + string.slice(1).toLocaleLowerCase()
}

const createJWT = (email, userId) => {
    var JWT = jwt.sign({ email: email, type: 'user', userId: userId }, config.privateKey);
    return JWT;
}


async function isEmailAlready(email) {
    return await User.findOne({ email: email }) ? true : false
}


const registerUser = async (req, res) => {


    if (!req.cookies.token) {
        const params = [
            'firstName',
            'lastName',
            'email',
            'password',
            'country',
            'university',
            'city',
            'phone'
        ];

        if (!checkMissingParams(params, req, res)) return;

        let { firstName, lastName, email, password, city, country, university, phone, lang } = req.body;
        firstName = CapitalizeString(firstName);
        lastName = CapitalizeString(lastName);
        email = email.toLowerCase();



        if (
            firstNameValidator(firstName, res) &&
            lastNameValidator(lastName, res) &&
            passwordValidator(password, res) &&
            await emailValidator(email, res)
        ) {

            const newUser = new User({
                firstName,
                lastName,
                email,
                hash: bcrypt.hashSync(password, 12),
                country,
                university,
                city,
                phone,
                lang: lang ? lang : "en"
            });



            await newUser.save(); // Insert to database
            const token = createJWT(email, newUser._id) // Create token
            res.cookie('token', token); // set token to the cookie
            res.status(200).send({ message: "User registered successfully", token: token, user: newUser }) // send response;




        }


    }
    else {
        res.status(500).send({ message: "You are already logged in" });
    }







};


const logOut = async (req, res) => {

    try {
        const token = req.body.token ? req.body.token : req.cookies.token;
        if (token) {
            var result = jwt.verify(token, config.privateKey);
            const user = await User.findOne({ email: result.email });
            global.socketUsers = global.socketUsers.filter(e => e.userId != user._id)
        }
        res.clearCookie('token');
        res.status(202).send({ message: 'Log Outed Successfully' })
    }
    catch (e) {
        res.send("ok");
    }

};
const refreshToken = async (req, res) => {
    try {
        const token = req.body.token ? req.body.token : req.cookies.token;

        if (token) {
            var result = jwt.verify(token, config.privateKey);
            const user = await User.findOne({ email: result.email })


            if (user) {
                res.cookie('token', token);
                res.status(200).send({ user: user })
            }
            else {
                new errorHandler(res, 500, 0)
            }
        }
        else {
            new errorHandler(res, 500, 0)
        }
    }
    catch (e) {
        new errorHandler(res, 500, 0)
    }

}
const login = async (req, res) => {


    if (await checkLogin(req) == false) {
        const { email, password } = req.body;
        const userByEmail = await User.findOne({ email: email });
        if (userByEmail) {
            const comparePassword = await bcrypt.compare(password, userByEmail.hash)
            const token = createJWT(email, userByEmail._id);
            if (comparePassword) {
                res.cookie('token', token); // set token to the cookie
                res.status(200).send({ token: token, user: userByEmail })
            }
            else {
                new errorHandler(res, 500, 13)
            }
        }
        else {
            new errorHandler(res, 404, 13)
        }

    }
    else {
        const user = await checkLogin(req);
        res.status(200).send({ token: req.cookies.token, user: user })
    }



};


const getVideo = async (req, res) => {
    try {

        const params = ['videoId'];
        if (!checkMissingParams(params, req, res)) return;
        const { videoId } = req.body;
        const video = await Video.findById(videoId)
        res.status(200).send({ video })

    }
    catch (e) {
        new errorHandler(res, 500, 0)
    }
}

const getAllVideos = async (req, res) => {
    try {
        if (await checkLogin(req)) {
            const params = ['categoryId'];
            const { categoryId } = req.body;
            let video = await Video.find({ categoryId: categoryId })
            video.sort((a, b) => (a.videoNumber > b.videoNumber) ? 1 : ((b.videoNumber > a.videoNumber) ? -1 : 0));

            const getuser = await checkLogin(req);
            let subscriptionEndDate = new Date(getuser.subscriptionEndDate).getTime();
            let nowDate = new Date().getTime();
            let constraint = getuser.subscription && nowDate < subscriptionEndDate;

            // TODO: Videoları Açarken paketin içerisinde olup olmadığına da bak
            if (!constraint) {
                video.map((item) => {
                    item.videoSource = !constraint && !item.freeTrial ? false : item.videoSource;

                    // item.thumb = constraint ? item.thumb : false;
                })
            }
            res.status(200).send({ data: video })
        }
        else {
            new errorHandler(res, 500, 0)
        }
    }
    catch (e) {
        new errorHandler(res, 500, 0)
    }
}


const getCategory = async (req, res) => {
    try {
        if (await checkLogin(req)) { // Admin ise
            const params = ['categoryId'];
            if (!checkMissingParams(params, req, res)) return;
            const { categoryId } = req.body;
            const category = await Category.findById(categoryId)
            res.status(200).send({ category })
        }
    }
    catch (e) {
        new errorHandler(res, 500, 0)
    }
}

const getAllCategories = async (req, res) => {
    try {
        if (await checkLogin(req)) { // Admin ise
            // No need any parameters
            let { lang } = req.body;

            if (!lang) lang = "en";
            const category = await Category.find()

            category.sort((a, b) => (a.categoryNumber > b.categoryNumber) ? 1 : ((b.categoryNumber > a.categoryNumber) ? -1 : 0));

            res.status(200).send({ data: category })
        }
    }
    catch (e) {
        new errorHandler(res, 500, 0)
    }
}

const getListCombo = async (req, res) => {
    // try {

    const token = req.cookies.token;
    if (token) {
        var userResult = jwt.verify(token, config.privateKey);
        const user = await User.findOne({ email: userResult.email })

        if (user) {
            const lang = user.lang.toLocaleLowerCase();
            let userSubscripton = false;
            let userAccessVideos = [];

            let subscriptionEndDate = new Date(user.subscriptionEndDate).getTime();
            let nowDate = new Date().getTime();

            if (nowDate < subscriptionEndDate) {
                userSubscripton = true;
                const price = await getUserPrice(user.priceId)
                if (price) { userAccessVideos = price.videos }
            }




            var comboList = [];



            const category = await Category.find({ lang }).lean();

            for (var categoryIndex = 0; categoryIndex < category.length; categoryIndex++) {

                const currentCategory = category[categoryIndex];

                const videos = await Video.find({ categoryId: currentCategory._id }).lean();

                for (var videoIndex = 0; videoIndex < videos.length; videoIndex++) {
                    const currentVideo = videos[videoIndex];

                    currentVideo.lock = true;


                    if (currentVideo.freeTrial) {
                        currentVideo.lock = false;
                    }
                    else if (userAccessVideos.includes(currentVideo._id)) {
                        currentVideo.lock = false;
                    }

                    if (currentVideo.lock == true) // güvenlik
                    {
                        currentVideo.videoSource = "";
                    }

                    const videoPart = await VideoPart.find({ videoId: currentVideo._id }).lean();
                    currentVideo.videoparts = videoPart;
                }

                if (videos) {
                    currentCategory.videos = videos;
                }
                else {
                    currentCategory.videos = [];
                }

                comboList = category;


            }


            category.sort((a, b) => (a.categoryNumber > b.categoryNumber) ? 1 : ((b.categoryNumber > a.categoryNumber) ? -1 : 0));





            res.status(200).send({ data: comboList })

        }
    }
    // }
    // catch (e) {
    //     new errorHandler(res, 500, 0)
    // }

}


const getVideoPart = async (req, res) => {
    try {
        if (await checkLogin(req)) { // Admin ise
            const params = ['videoPartId'];
            if (!checkMissingParams(params, req, res)) return;
            const { videoPartId } = req.body;
            const videoPart = await VideoPart.findById(videoPartId)
            res.status(200).send({ videoPart })
        }
    }
    catch (e) {
        new errorHandler(res, 500, 0)
    }
}

const getAllVideoParts = async (req, res) => {
    try {
        if (await checkLogin(req)) { // Admin ise
            // No need any parameters
            const { videoId } = req.body;
            const videoPart = await VideoPart.find({ videoId: videoId })
            res.status(200).send({ data: videoPart })
        }
    }
    catch (e) {
        new errorHandler(res, 500, 0)
    }
}

const changeUserProfile = async (req, res) => {
    try {
        if (await checkLogin(req)) { // Admin ise
            const { firstName, lastName, email, country, university, city, phone } = req.body;

            const token = req.cookies.token;
            var userResult = jwt.verify(token, config.privateKey);
            const user = await User.findOne({ email: userResult.email })
            if (user._id == "609243189055c4209480afc6" || email == "test@test.com") return res.status(500).send("No account")
            if (user) {

                let newToken = token;
                if (userResult.email != email) {
                    newToken = createJWT(email)
                    res.cookie('token', newToken); // set token to the cookie

                }

                await user.updateOne({ firstName, lastName, email, country, university, city, phone });
                const newUser = await User.findById(user._id)

                res.status(200).send({ token: newToken, user: newUser })
            }
            else {
                res.status(500).send({ error: 'error' })
            }


        }
    }
    catch (e) {
        console.log(e)
        // new errorHandler(res, 500, 0)
        res.status(500).send({ error: 'error' })
    }
}

const changePassword = async (req, res) => {
    // try {
    if (await checkLogin(req)) { // Admin ise
        const { oldPassword, newPassword } = req.body;

        const token = req.cookies.token;
        var userResult = jwt.verify(token, config.privateKey);
        const user = await User.findOne({ email: userResult.email })
        if (user) {
            const comparePassword = await bcrypt.compare(oldPassword, user.hash)
            if (comparePassword) {
                // if old password was correct
                const hash = bcrypt.hashSync(newPassword, 12);
                await user.updateOne({ hash });
                const newUser = await User.findById(user._id)

                res.status(200).send({ user: newUser })
            }
            else {
                res.status(500).send({ error: "Old password was not correct" })
            }



        }
        else {
            res.status(500).send({ error: 'error user not found' })
        }


    }
    // }
    // catch (e) {
    //     console.log(e)
    //     // new errorHandler(res, 500, 0)
    //     res.status(500).send({ error: 'error', e: e })
    // }
}

const getUserPrice = async (priceId) => {
    try {
        if (priceId) {
            const userPrice = await Prices.findById(priceId);
            return userPrice;
        }
        else {
            return null;
        }
    }
    catch (e) {

        return null;
    }


}

const isUserSubscribed = async (req, res) => {

    const token = req.cookies.token;
    if (token) {
        var userResult = jwt.verify(token, config.privateKey);
        var user = await User.findOne({ email: userResult.email })
        if (user) {

            const _controlPrevPayment = await controlPrevPayment(user);
            if (_controlPrevPayment) {
                user = await User.findOne({ email: userResult.email })
            }

            let subscriptionEndDate = new Date(user.subscriptionEndDate).getTime();
            let nowDate = new Date().getTime();
            // if (user.subscription && nowDate < subscriptionEndDate) 

            if (nowDate < subscriptionEndDate) {

                const priceInformationGet = await getUserPrice(user.priceId);
                res.status(200).send({ subscribe: true, subscriptionEndDate: subscriptionEndDate, priceInformation: priceInformationGet });
            }
            else {
                res.status(500).send({ subscribe: false });
            }

        }
        else {
            res.status(500).send({ subscribe: false });
        }
    }
    else {
        res.status(500).send({ subscribe: false });
    }


}

const sendMail = async (req, res) => {
    const { email, title, content } = req.body;
    const mailjet = require('node-mailjet')
        .connect('f1eea4906be660d06590659d8f738d71', '21e8ad4bf8a2eff76dd2f34169ea7ed9')
    const request = mailjet
        .post("send", { 'version': 'v3.1' })
        .request({
            "Messages": [
                {
                    "From": {
                        "Email": "maze.software.mail.sender@gmail.com",
                        "Name": "Maze"
                    },
                    "To": [
                        {
                            "Email": config.mailAdress,
                            "Name": "Maze Software Mail Sender : Dr. Patris"
                        }
                    ],
                    "Subject": "Kullanıcınız Yeni Mesajınız Var",
                    "TextPart": "Kullanıcıdan yeni mseajınız var",
                    "HTMLPart": "<strong> Email: </strong>" + email + " adlı kullanıcıdan mesaj var. <br><strong> Title: </strong>" + title + "<br> <strong> Message: </strong>" + content
                }
            ]
        })
    request
        .then((result) => {
            // console.log(result.body)
            res.send("ok")
        })
        .catch((err) => {
            res.send("fail")
            console.log(err.statusCode)
        })



}

const forgetPassword = async (req, res) => {
    const { email } = req.body;
    const newPassword = generateRandomPassword(10);


    const user = await User.findOne({ email: email });
    await user.updateOne({ hash: bcrypt.hashSync(newPassword, 12) })

    if (user) {


        const mailjet = require('node-mailjet')
            .connect('f1eea4906be660d06590659d8f738d71', '21e8ad4bf8a2eff76dd2f34169ea7ed9')
        const request = mailjet
            .post("send", { 'version': 'v3.1' })
            .request({
                "Messages": [
                    {
                        "From": {
                            "Email": "maze.software.mail.sender@gmail.com",
                            "Name": "Maze"
                        },
                        "To": [
                            {
                                "Email": email,
                                "Name": "Dr. Patris Lectures"
                            }
                        ],
                        "Subject": "Change Password Request",
                        "TextPart": "You have requested new password",
                        "HTMLPart": "<br><br><strong> Your new password: </strong>" + newPassword
                    }
                ]
            })
        request
            .then((result) => {
                // console.log(result.body)
                res.send("ok")
            })
            .catch((err) => {
                res.send("fail")
                console.log(err.statusCode)
            })

    }






}

function generateRandomPassword(length) {
    var result = '';
    var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for (var i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

const watchedInfo = async (req, res) => {
    try {
        if (await checkLogin(req)) {
            const user = await checkLogin(req)

            const { videoId, timeOfWatched, isComplated } = req.body;
            const schema = {
                userId: user._id,
                videoId,
                timeOfWatched,

            };
            if (isComplated) { schema.isComplated = isComplated }


            const updateIfAldready = await WatchedInfo.findOne({ userId: user._id, videoId: videoId });

            if (updateIfAldready) {
                await WatchedInfo.updateOne({ userId: user._id, videoId: videoId }, schema);
                res.status(200).send({ message: "ok" })
            }
            else {
                const newWatchInfo = new WatchedInfo(schema);
                await newWatchInfo.save();
                res.status(200).send({ message: "ok" })
            }


        }
        else {
            new errorHandler(res, 500, 0);
        }
    }
    catch (e) {
        new errorHandler(res, 500, 1);
        console.log(e)
    }
}

const getWatchedInfo = async (req, res) => {
    try {
        if (await checkLogin(req)) {
            const user = await checkLogin(req)

            const infoList = await WatchedInfo.find({ userId: user._id });

            res.send({ data: infoList })

        }
        else {
            new errorHandler(res, 500, 0);
        }
    }
    catch (e) {
        new errorHandler(res, 500, 1);
        console.log(e)
    }
}
const controlPrevPayment = async (user, res = null) => {

    const filterDate = new Date();
    filterDate.setMinutes(filterDate.getMinutes() - 7200);


    const paidBefore = await Payments.findOne({ userId: user._id, isPaid: false, date: { $gt: filterDate } }).sort({ date: -1 })
    if (paidBefore) {
        const paymentStatus = await getPaymentStatus(paidBefore.paymentId);

        if (paymentStatus) {
            await activateUserSubscription(paidBefore.paymentId, res);
            return true;
        }
        else {
            // silebiliriz paymenti
            await Payments.findByIdAndRemove(paidBefore._id);
            return false;
        }
    }

}

const paymentForm = async (req, res) => {



    const currencies = [
        "RUR",
        "USD",
        "EUR",
        "KZT"
    ];

    if (config.appstoreReview) {
        res.send("Payment is disabled, We are working on app store in-app purchases system");
        return;
    }
    const { userToken, priceId } = req.body;

    if (!userToken || !priceId) {
        res.send("userToken or price null");
        return;
    }
    const getProduct = await Prices.findById(priceId);
    const result = jwt.verify(userToken, config.privateKey);
    const user = await User.findOne({ email: result.email })
    const lang = user.lang
    // console.log("Product", getProduct)

    if (!user || !getProduct) {
        res.send("Error, couldn't access user token or product information")
        return "";
    }




    const pg_merchant_id = "538933";
    const secret_key = "YbKQc0mq9t9GB0fb";
    const url = "https://api.paybox.money/init_payment.php";
    var md5 = require('md5');
    const order_id = Math.random().toString(36).substr(2, 9)
    let request = [
        url.split('/').pop(),
        { pg_merchant_id: pg_merchant_id },
        { pg_amount: getProduct.price },
        { pg_currency: currencies.includes(getProduct.currency.toUpperCase()) ? getProduct.currency.toUpperCase() : 'kgs' },
        { pg_description: getProduct.priceContent + "   description" },
        { pg_salt: "LM9RhvtI3CNw3CoC" },
        { pg_language: getProduct.lang },
        { pg_order_id: order_id },
        { pg_success_url: 'https://patris.mazedev.online/api/user/paymentcallback' },
        // { pg_success_url: 'https://' + req.get('host') + '/api/user/paymentcallback' }

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
    const requestObj = {};
    request.forEach(obj => {
        requestObj[Object.keys(obj)] = obj[Object.keys(obj)]
    })


    // //POST ATMA

    const axios = require("axios");
    const res2 = await axios.default.get(url, {
        // ...requestObj
        params: {
            ...requestObj
        }
    });
    var parser = require('xml2json');
    // xml to json
    var json = parser.toJson(res2.data, { object: true });
    // console.log(json);
    const cutomer_id = json.response.pg_redirect_url.split("/").pop().substring(18)


    const payment = new Payments({
        userId: user._id,
        iyziCoToken: "TOKEN YOK",
        customerId: cutomer_id,
        paymentId: json.response.pg_payment_id,
        amount: getProduct.price,
        subscriptionType: getProduct.month,
        date: new Date(),
        isPaid: false,
        priceId: getProduct._id
    })
    await payment.save();
    res.send(`<script>window.location = '${json.response.pg_redirect_url}' </script><a href='${json.response.pg_redirect_url}'>Continue</a>`)





}

const activateUserSubscription = async (paymentId, res = null) => {

    const findPayment = await Payments.findOne({ paymentId: paymentId })

    const user = await User.findById(findPayment.userId)
    // console.log(user)
    if (user) {
        const newPayment = await findPayment.updateOne({ isPaid: true })
        const newDate = new Date();
        const subscriptionEndDate = newDate.setMonth(newDate.getMonth() + findPayment.subscriptionType)
        await user.updateOne({ subscription: true, subscriptionEndDate: subscriptionEndDate, priceId: findPayment.priceId })
        if (res) res.status(200).send("Payment is successful")
    }
    else {
        if (res) res.send("Error occoured while payment")
    }

}

var base64 = require('base-64');
var crypto = require('crypto');
const paymentCallBack = async (req, res) => {


    // console.log(req.body)
    activateUserSubscription(req.body.pg_payment_id, res)
    // pg_order_id: 'lnytlnw3i',
    // pg_payment_id: '482861159',
    // pg_salt: '4F3MfALcBWKwJQrm',
    // pg_sig: 'b9a6b76b52d13b99c43dea6fc0050c7b'

}




// const paymentForm = async (req, res) => {
//     if (config.appstoreReview) {
//         res.send("Payment is disabled, We are working on app store in-app purchases system");
//         return;
//     }
//     const { userToken, priceId } = req.body;
//     if (!userToken || !priceId) {
//         res.send("userToken or price null");
//         return;
//     }
//     const getProduct = await Prices.findById(priceId);
//     const result = jwt.verify(userToken, config.privateKey);
//     const user = await User.findOne({ email: result.email })
//     const lang = user.lang


//     if (!user || !getProduct) {
//         res.send("Error, couldn't access user token or product information")
//         return "";
//     }

//     const langText = {
//         tr: {
//             continue: "Devam",
//             emailText: "Ödeme işleme sırasında lütfen emailinizi ve adınızı kayıtlı olduğunuz email adresi ve adınız şeklinde yazın aksi takdirde, ödemeniz geçersiz sayılır. Ödeme yaptıkdan sonra uygulamayı yeniden başlatmayı unutmayın !"
//         },
//         en: {
//             continue: "Continue",
//             emailText: "During the payment processing, please write your email and name as your registered e-mail address and your name, otherwise your payment will be deemed invalid. Don't forget to restart the app after your payment !"
//         },
//         per:
//         {
//             continue: "ادامه هید",
//             emailText: "فراموش نکنید که برنامه را پس از پرداخت دوباره راه اندازی کنید! در هنگام پردازش پرداخت ، لطفاً ایمیل و نام خود را به عنوان آدرس پست الکترونیکی ثبت شده و نام خود بنویسید ، در غیر این صورت پرداخت شما نامعتبر شناخته می شود.",

//         },
//         ru: {
//             continue: "Продолжать",
//             emailText: "Во время обработки платежа укажите свой адрес электронной почты и имя в качестве зарегистрированного адреса электронной почты и свое имя, иначе ваш платеж будет считаться недействительным. Не забудьте перезапустить приложение после оплаты!",

//         }

//     }
//     res.status(200).send(`
//     <!doctype html>
//     <html lang="en">
//       <head>
//         <!-- Required meta tags -->
//         <meta charset="utf-8">
//         <meta name="viewport" content="width=device-width, initial-scale=1">

//         <!-- Bootstrap CSS -->
//         <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-eOJMYsd53ii+scO/bJGFsiCZc+5NDVN2yr8+0RDqr0Ql0h+rP48ckxlpbzKgwra6" crossorigin="anonymous">

//         <title>Payment</title>
//       </head>
//       <body>

//        <p>${langText[lang].emailText}</p>
//        <p>email:${user.email}</p>
//        <a href="https://shopier.com/${getProduct.shopierId}" type="button" class="btn btn-primary">${langText[lang].continue}</a>

//         <!-- Optional JavaScript; choose one of the two! -->

//         <!-- Option 1: Bootstrap Bundle with Popper -->
//         <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta3/dist/js/bootstrap.bundle.min.js" integrity="sha384-JEW9xMcG8R+pH31jmWH6WWP0WintQrMb4s7ZOdauHnUtxwoG2vI5DkLtS3qm9Ekf" crossorigin="anonymous"></script>

//         <!-- Option 2: Separate Popper and Bootstrap JS -->
//         <!--
//         <script src="https://cdn.jsdelivr.net/npm/@popperjs/core@2.9.1/dist/umd/popper.min.js" integrity="sha384-SR1sx49pcuLnqZUnnPwx6FCym0wLsk5JZuNx2bPPENzswTNFaQU1RDvt3wT4gWFG" crossorigin="anonymous"></script>
//         <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.0.0-beta3/dist/js/bootstrap.min.js" integrity="sha384-j0CNLUeiqtyaRmlzUHCPZ+Gy5fQu0dQ6eZ/xAww941Ai1SxSY+0EQqNXNE6DZiVc" crossorigin="anonymous"></script>
//         -->
//         <style>
//             body{display: flex;
//                 justify-content: center;
//                 align-items: center;
//                 flex-direction: column;
//                 padding: 40px;}
//         </style/>
//       </body>
//     </html>
//     `)
// }
// var base64 = require('base-64');
// var crypto = require('crypto');
// const paymentCallBack = async (req, res) => {
//     const osbUsername = "623117c770a29cbfd0215f36982c47f3";
//     const osbKey = "38caad28030506a21923e985ab268cc4";


//     if (req.body.res && req.body.hash) {
//         const content = JSON.parse(base64.decode(req.body.res)) // 0..TL, 1..USD, 2...EUR
//         const email = content.email
//         const productId = content.productid
//         const orderId = content.orderid
//         const user = await User.findOne({ email: email })
//         if (!user) {
//             res.send("Your email is not registered. Please send ticket to us with this order numer : " + content.orderid + " email:" + content.email + " product id : " + productId)
//             return "";
//         }
//         const getProduct = await Prices.findOne({ shopierId: productId })
//         if (!getProduct) {
//             res.send("Product is not found. Please send ticket to us with this order numer : " + content.orderid + " email:" + content.email + " product id : " + productId)
//             return "";
//         }

//         const newDate = new Date();
//         const subscriptionEndDate = newDate.setMonth(newDate.getMonth() + getProduct.month)
//         await user.updateOne({ subscription: true, subscriptionEndDate: subscriptionEndDate, priceId: getProduct._id })
//         res.status(200).send(`
//         Payment is successful. Please restart the app ! /n
//         Ödeme başarılı. Lütfen Uygulamayı Yeniden Başlatın ! /n
//         Оплата прошла успешно. Пожалуйста, перезапустите приложение!
//         پرداخت موفقیت آمیز است. لطفاً برنامه را مجدداً راه اندازی کنید!`)





//     }




// }


const paymentFormIYZICO = async (req, res) => {

    if (config.appstoreReview) {
        res.send("Payment is disabled, We are working on app store in-app purchases system");
        return;
    }

    // try {
    const { userToken, priceId } = req.body;
    const getPrice = await Prices.findById(priceId);

    const result = jwt.verify(userToken, config.privateKey);
    const paidPrice = getPrice.price;
    const user = await User.findOne({ email: result.email })
    let currency;
    switch (getPrice.currency) {
        case "TR": currency = Iyzipay.CURRENCY.TRY; break;
        case "USD": currency = Iyzipay.CURRENCY.USD; break;
        case "EUR": currency = Iyzipay.CURRENCY.EUR; break;
        case "RUB": currency = Iyzipay.CURRENCY.RUB; break;
        case "GBP": currency = Iyzipay.CURRENCY.GBP; break;
        case "IRR": currency = Iyzipay.CURRENCY.IRR; break;
        case "NOK": currency = Iyzipay.CURRENCY.NOK; break;
        case "CHF": currency = Iyzipay.CURRENCY.CHF; break;
        default: currency = Iyzipay.CURRENCY.TRY; break;
    }


    var request = {
        locale: Iyzipay.LOCALE.EN,
        conversationId: "canerkocas06@gmail.com",
        price: Number(paidPrice),
        paidPrice: paidPrice,
        currency: currency,
        basketId: 'B67832',
        paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
        callbackUrl: 'https://' + req.get('host') + '/api/user/paymentcallback',
        enabledInstallments: [2, 3, 6, 9],
        buyer: {
            id: "123456789",
            name: user.firstName,
            surname: user.lastName,
            gsmNumber: '+905350000000',
            email: user.email,
            identityNumber: '74300864791',
            lastLoginDate: '2015-10-05 12:43:35',
            registrationDate: '2013-04-21 15:12:09',
            registrationAddress: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
            ip: '85.34.78.112',
            city: 'Istanbul',
            country: 'Turkey',
            zipCode: '34732'
        },
        shippingAddress: {
            contactName: 'Jane Doe',
            city: 'Istanbul',
            country: 'Turkey',
            address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
            zipCode: '34742'
        },
        billingAddress: {
            contactName: 'Jane Doe',
            city: 'Istanbul',
            country: 'Turkey',
            address: 'Nidakule Göztepe, Merdivenköy Mah. Bora Sok. No:1',
            zipCode: '34742'
        },
        basketItems: [
            {
                id: 'BI101',
                name: 'Binocular',
                category1: 'Collectibles',
                category2: 'Accessories',
                itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
                price: paidPrice
            }
        ]
    };
    iyzipay.checkoutFormInitialize.create(request, async function (err, result) {
        // console.log(err, result);
        const iyzicoToken = result.token;

        const createPayment = new Payments({
            userId: user._id,
            iyziCoToken: iyzicoToken,
            amount: paidPrice,
            subscriptionType: getPrice.month,
            date: new Date(),
            isPaid: false,
            priceId: priceId
        })
        await createPayment.save();
        if (result.status == 'success') {
            res.send(`
            <html>
            <head>
    <meta charset="UTF-8">
    <title>iyzico Payment Page</title>

    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="description" content="">
    <meta name="author" content="iyzico team">
    <link rel="icon" href="/img/favicon.ico">

       <body style="margin:0">
            
            <iframe src="${result.paymentPageUrl}&iframe=true" style="width:100%;height:100%;border:0" allowfullscreen></iframe><body>
            
            </html>
            `)

        }
        else {
            res.send(result)
        }

    });

    // }
    // catch (e) {
    //     new errorHandler(res, 500, 1);
    // }

}

const paymentCallBackIYZICO = async (req, res) => {



    iyzipay.checkoutForm.retrieve({
        locale: Iyzipay.LOCALE.TR,
        token: req.body.token
    }, async function (err, result) {
        // console.log(err, result);
        if (result.status == 'success') {

            // Payment Successful
            // try {

            const findPayment = await Payments.findOne({ iyziCoToken: req.body.token })

            const user = await User.findById(findPayment.userId)
            if (user) {

                const newPayment = await findPayment.updateOne({ isPaid: true })
                const newDate = new Date();
                const subscriptionEndDate = newDate.setMonth(newDate.getMonth() + findPayment.subscriptionType)
                await user.updateOne({ subscription: true, subscriptionEndDate: subscriptionEndDate, priceId: findPayment.priceId })
                res.status(200).send("Payment is successful")
            }

            // }
            // catch (e) {

            //     res.send("Error happened")
            //     console.log(e)
            // }






        }
        else {

            res.send("Error occoured while payment, " + err.errorMessage)
        }
    });


}
const getSuggestedVideos = async (req, res) => {
    // try {

    const token = req.cookies.token;
    if (token) {
        var userResult = jwt.verify(token, config.privateKey);
        const user = await User.findOne({ email: userResult.email })
        if (user) {

            let userSubscripton = false;
            let userAccessVideos = [];

            let subscriptionEndDate = new Date(user.subscriptionEndDate).getTime();
            let nowDate = new Date().getTime();

            if (nowDate < subscriptionEndDate) {
                userSubscripton = true;
                const price = await getUserPrice(user.priceId)
                if (price) {
                    userAccessVideos = price.videos
                }

            }



            let returnList = [];
            let { lang } = req.body;
            if (!lang) lang = "en";


            const getCategory = await Category.find({ lang: lang }).lean();
            for (var i = 0; i < getCategory.length; i++) {
                let videos = await Video.find({ categoryId: getCategory[i]._id }).limit(4).lean();
                for (var q = 0; q < videos.length; q++) {
                    const currentVideo = videos[q];
                    currentVideo.lock = true;


                    if (currentVideo.freeTrial) {
                        currentVideo.lock = false;
                    }
                    else if (userAccessVideos.includes(currentVideo._id)) {
                        currentVideo.lock = false;
                    }

                    if (currentVideo.lock == true) // güvenlik
                    {
                        currentVideo.videoSource = "";
                    }


                    videos[q].category = getCategory[i];
                }

                returnList = videos;
            }


            for (var x = 0; x < returnList.length; x++) {
                returnList[x].videoparts = await VideoPart.find({ videoId: returnList[x]._id }).lean();
            }


            res.send({ data: returnList })
        }
    }
    else {
        new errorHandler(res, 500, 0);
    }
    // }
    // catch (e) {
    //     new errorHandler(res, 500, 1);
    //     console.log(e)
    // }




}


const getScreenShotRemains = async (req, res) => {
    const AttemptLeftDefault = 5;
    // try {
    const { email } = req.body;
    const findUserInList = await ScreenShot.exists({ email: email });

    if (findUserInList) {
        const getUserFromList = await ScreenShot.findOne({ email: email })
        res.send({ count: getUserFromList.attemptLeft })
    }
    else {
        res.send({ count: AttemptLeftDefault })
    }
    // }
    // catch (e) {

    // }
}
const takeScreenShot = async (req, res) => {
    const AttemptLeftDefault = 5;
    // try {
    const { email } = req.body;
    if (email) {
        const findUserInList = await ScreenShot.exists({ email: email })
        if (findUserInList) {
            const getUserFromList = await ScreenShot.findOne({ email: email })
            // update

            await ScreenShot.updateOne({ email: email }, { attemptLeft: Number(getUserFromList.attemptLeft) - 1 });


            if (Number(getUserFromList.attemptLeft) - 1 < 1) {
                // cancel the subscription
                // Üyeliği İptal Et

                await User.findOneAndUpdate({ email: email }, { subscriptionEndDate: Date.now(), subscription: false })


            }

            res.send({ count: Number(getUserFromList.attemptLeft) - 1 })

        }
        else {
            // add new
            const newScreenShot = new ScreenShot({
                email: email,
                attemptLeft: AttemptLeftDefault - 1
            });
            await newScreenShot.save();
            res.send({ count: AttemptLeftDefault - 1 })
        }

    }
    // }
    // catch (e) {

    // }
}


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
    return json.response.pg_transaction_status == "ok";
}
const termsAndCondition = (req, res) => {

    const { type = 2 } = req.body;
    if (type == 1) {
        res.send(`
        
<html>

<head>
<meta http-equiv=Content-Type content="text/html; charset=utf-8">
<meta name=Generator content="Microsoft Word 15 (filtered)">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
<!--
 /* Font Definitions */
 @font-face
	{font-family:Wingdings;
	panose-1:5 0 0 0 0 0 0 0 0 0;}
@font-face
	{font-family:SimSun;
	panose-1:2 1 6 0 3 1 1 1 1 1;}
@font-face
	{font-family:"Cambria Math";
	panose-1:2 4 5 3 5 4 6 3 2 4;}
@font-face
	{font-family:Calibri;
	panose-1:2 15 5 2 2 2 4 3 2 4;}
@font-face
	{font-family:"\@SimSun";
	panose-1:2 1 6 0 3 1 1 1 1 1;}
 /* Style Definitions */
 p.MsoNormal, li.MsoNormal, div.MsoNormal
	{margin-top:0in;
	margin-right:0in;
	margin-bottom:10.0pt;
	margin-left:0in;
	line-height:115%;
	font-size:11.0pt;
	font-family:"Calibri",sans-serif;}
p.MsoListParagraph, li.MsoListParagraph, div.MsoListParagraph
	{margin-top:0in;
	margin-right:0in;
	margin-bottom:10.0pt;
	margin-left:.5in;
	line-height:115%;
	font-size:11.0pt;
	font-family:"Calibri",sans-serif;}
p.MsoListParagraphCxSpFirst, li.MsoListParagraphCxSpFirst, div.MsoListParagraphCxSpFirst
	{margin-top:0in;
	margin-right:0in;
	margin-bottom:0in;
	margin-left:.5in;
	line-height:115%;
	font-size:11.0pt;
	font-family:"Calibri",sans-serif;}
p.MsoListParagraphCxSpMiddle, li.MsoListParagraphCxSpMiddle, div.MsoListParagraphCxSpMiddle
	{margin-top:0in;
	margin-right:0in;
	margin-bottom:0in;
	margin-left:.5in;
	line-height:115%;
	font-size:11.0pt;
	font-family:"Calibri",sans-serif;}
p.MsoListParagraphCxSpLast, li.MsoListParagraphCxSpLast, div.MsoListParagraphCxSpLast
	{margin-top:0in;
	margin-right:0in;
	margin-bottom:10.0pt;
	margin-left:.5in;
	line-height:115%;
	font-size:11.0pt;
	font-family:"Calibri",sans-serif;}
.MsoChpDefault
	{font-family:"Calibri",sans-serif;}
.MsoPapDefault
	{margin-bottom:10.0pt;
	line-height:115%;}
 /* Page Definitions */
 @page WordSection1
	{size:595.3pt 841.9pt;
	margin:56.7pt 42.5pt 56.7pt 85.05pt;}
div.WordSection1
	{page:WordSection1;}
 /* List Definitions */
 ol
	{margin-bottom:0in;}
ul
	{margin-bottom:0in;}
-->
</style>

</head>

<body lang=EN-US style='word-wrap:break-word'>

<div class=WordSection1>

<p class=MsoNormal align=right style='text-align:right'><span lang=RU>Редакция
от 23 июня 2021 г. </span></p>

<p class=MsoNormal align=center style='text-align:center'><b><span lang=RU>Оферта
на заключение договора</span></b></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>Настоящий документ, постоянно размещенный в приложении «</span>Dr<span
lang=RU>. </span>Patris Lectures<span lang=RU>» </span><span lang=RU>по ссылке:
https://apps.apple.com/kg/app/dr-patris-lectures/id1548938154, является
публичной офертой в соответствии со статьей 398 Гражданского Кодекса Кыргызской
Республики на заключение Договора оказания услуг удаленного доступа (далее -
Договор) с любым заинтересованным физическим лицом (далее - Заказчик).
Надлежащим акцептом настоящей оферты в соответствии с пунктом 3 статьи 399 Гражданского
Кодекса Кыргызской Республики является совершение Заказчиком в совокупности
следующих действий</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>- нажатия кнопки «Я принимаю условия оферты» при прохождении
регистрации в приложении «</span>Dr<span lang=RU>. </span>Patris Lectures<span
lang=RU>»</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>- нажатия кнопки «Я принимаю условия политики обработки персональных
данных» при прохождении регистрации в приложении «</span>Dr<span lang=RU>. </span>Patris
Lectures<span lang=RU>»</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>&nbsp;</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>Для получения доступа к отдельным видео Приложения, Пользователю
требуется: </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>● оплатить Тариф Исполнителя в порядке, определенном в Договоре.</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>&nbsp;</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>Оплачивая стоимость услуг Исполнителя, Заказчик:</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU> - гарантирует достоверность и актуальность сведений, предоставляемых о
себе;</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU> - гарантирует, что он является совершеннолетним и полностью
дееспособным лицом; </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>- соглашается, что он самостоятельно несет ответственность за любые
последствия, возникающие в результате указания недостоверных, неактуальных или
неполных сведений о себе. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>&nbsp;</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>Датой акцепта оферты Заказчиком (датой заключения Договора) считается
дата зачисления денежных средств за оказание Исполнителем услуг на расчетный
счет Исполнителя.</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU style='font-size:14.0pt;line-height:115%'>&nbsp;</span></p>

<p class=MsoNormal align=center style='text-align:center'><b><span lang=RU>Договор</span></b></p>

<p class=MsoListParagraphCxSpFirst style='margin-left:20.25pt;text-align:justify;
text-justify:inter-ideograph;text-indent:-.25in'><b><span lang=RU>1.<span
style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; </span></span></b><b><span
lang=RU>Термины и определения </span></b></p>

<p class=MsoListParagraphCxSpMiddle style='margin-left:20.25pt;text-align:justify;
text-justify:inter-ideograph'><span lang=RU>&nbsp;</span></p>

<p class=MsoListParagraphCxSpMiddle style='margin-left:20.25pt;text-align:justify;
text-justify:inter-ideograph'><span lang=RU>В Договоре, если иное прямо не
вытекает из текста, указанные ниже термины будут иметь следующие значения:</span></p>

<p class=MsoListParagraphCxSpMiddle style='margin-left:20.25pt;text-align:justify;
text-justify:inter-ideograph'><span lang=RU>&nbsp;</span></p>

<table class=MsoTableGrid border=0 cellspacing=0 cellpadding=0
 style='margin-left:20.25pt;border-collapse:collapse;border:none'>
 <tr>
  <td width=124 valign=top style='width:93.05pt;padding:0in 5.4pt 0in 5.4pt'>
  <p class=MsoListParagraphCxSpMiddle style='margin-top:0in;margin-right:0in;
  margin-bottom:0in;margin-left:1.05pt;text-align:justify;text-justify:inter-ideograph;
  line-height:normal'><b><span lang=RU>Приложение</span></b></p>
  <p class=MsoListParagraphCxSpLast style='margin:0in;text-align:justify;
  text-justify:inter-ideograph;line-height:normal'><span lang=RU>&nbsp;</span></p>
  </td>
  <td width=487 valign=top style='width:365.25pt;padding:0in 5.4pt 0in 5.4pt'>
  <p class=MsoNormal style='margin-bottom:0in;text-align:justify;text-justify:
  inter-ideograph;line-height:normal'><span lang=RU>Сложный объект
  интеллектуальных прав, исключительное право на который принадлежит
  Исполнителю, доступный по адресу: https://apps.apple.com/kg/app/dr-patris-lectures/id1548938154,
  состоящий из совокупности представленных в объективной форме данных и команд,
  предназначенных для использования на мобильных устройствах в целях получения
  определенного результата, включая программную оболочку для интерактивного
  (мультимедийного) взаимодействия с содержащейся в программе информацией и
  порождаемые ею аудиовизуальные отображения. Под результатом в данном случае
  понимается организация процесса самообучения Заказчика по выбранной им
  тематике, а аудиовизуальным отображением - совокупность информации, текстов,
  графических элементов, дизайна, изображений, фото и видеоматериалов и иных
  объектов интеллектуальной собственности, доступ к которым осуществляется
  путем предоставления Заказчику возможности использования различных данных и
  команд.</span></p>
  <p class=MsoListParagraph style='margin:0in;text-align:justify;text-justify:
  inter-ideograph;line-height:normal'><span lang=RU>&nbsp;</span></p>
  </td>
 </tr>
 <tr>
  <td width=124 valign=top style='width:93.05pt;padding:0in 5.4pt 0in 5.4pt'>
  <p class=MsoNormal style='margin-bottom:0in;text-align:justify;text-justify:
  inter-ideograph;line-height:normal'><b><span lang=RU>Личный кабинет </span></b></p>
  <p class=MsoListParagraph style='margin:0in;text-align:justify;text-justify:
  inter-ideograph;line-height:normal'><span lang=RU>&nbsp;</span></p>
  </td>
  <td width=487 valign=top style='width:365.25pt;padding:0in 5.4pt 0in 5.4pt'>
  <p class=MsoNormal style='margin-bottom:0in;text-align:justify;text-justify:
  inter-ideograph;line-height:normal'><span lang=RU>Создается в результате
  регистрации Заказчика, при вводе его аутентификационных данных (ФИО, место
  проживания, место обучения, адреса электронной почты и пароля) посредством
  заполнения специальной формы в Приложении. Юридически значимые действия,
  совершенные Заказчиком через его Личный Кабинет являются совершенными с его простой
  электронной подписью, где идентификатором и ключом электронной подписи
  является его аутентификационные данные.</span></p>
  <p class=MsoListParagraph style='margin:0in;text-align:justify;text-justify:
  inter-ideograph;line-height:normal'><span lang=RU>&nbsp;</span></p>
  </td>
 </tr>
 <tr>
  <td width=124 valign=top style='width:93.05pt;padding:0in 5.4pt 0in 5.4pt'>
  <p class=MsoNormal style='margin-bottom:0in;text-align:justify;text-justify:
  inter-ideograph;line-height:normal'><b><span lang=RU>Курс </span></b></p>
  <p class=MsoListParagraph style='margin:0in;text-align:justify;text-justify:
  inter-ideograph;line-height:normal'><span lang=RU>&nbsp;</span></p>
  </td>
  <td width=487 valign=top style='width:365.25pt;padding:0in 5.4pt 0in 5.4pt'>
  <p class=MsoNormal style='margin-bottom:0in;text-align:justify;text-justify:
  inter-ideograph;line-height:normal'><span lang=RU>Определенная часть
  информации, содержащейся в Приложении, доступ к которой передается путем
  предоставления Заказчику определенных данных и команд, состоящая из
  совокупности взаимосвязанных занятий и материалов (тексты, фото- и
  видеоматериалы, иные объекты интеллектуальных прав), объединенных единой
  темой, расположенных в определенной последовательности и направленных на
  самостоятельное приобретение Заказчиком знаний и навыков по соответствующей
  теме. </span></p>
  <p class=MsoListParagraph style='margin:0in;text-align:justify;text-justify:
  inter-ideograph;line-height:normal'><span lang=RU>&nbsp;</span></p>
  </td>
 </tr>
 <tr>
  <td width=124 valign=top style='width:93.05pt;padding:0in 5.4pt 0in 5.4pt'>
  <p class=MsoNormal style='margin-bottom:0in;text-align:justify;text-justify:
  inter-ideograph;line-height:normal'><b><span lang=RU>Занятие </span></b></p>
  <p class=MsoListParagraph style='margin:0in;text-align:justify;text-justify:
  inter-ideograph;line-height:normal'><span lang=RU>&nbsp;</span></p>
  </td>
  <td width=487 valign=top style='width:365.25pt;padding:0in 5.4pt 0in 5.4pt'>
  <p class=MsoNormal style='margin-bottom:0in;text-align:justify;text-justify:
  inter-ideograph;line-height:normal'><span lang=RU>Лекция, проводимая через
  функционал Приложения в дистанционной форме (онлайн) в формате записи: Запись
  — записанная лекция, которая доступна онлайн. Доступ Заказчика к лекции в
  формате записи возможен в любое время пока не истечет оплаченная Заказчиком подписка.
  </span></p>
  <p class=MsoListParagraph style='margin:0in;text-align:justify;text-justify:
  inter-ideograph;line-height:normal'><span lang=RU>&nbsp;</span></p>
  </td>
 </tr>
 <tr>
  <td width=124 valign=top style='width:93.05pt;padding:0in 5.4pt 0in 5.4pt'>
  <p class=MsoNormal style='margin-bottom:0in;text-align:justify;text-justify:
  inter-ideograph;line-height:normal'><b><span lang=RU>Тариф </span></b></p>
  <p class=MsoListParagraph style='margin:0in;text-align:justify;text-justify:
  inter-ideograph;line-height:normal'><span lang=RU>&nbsp;</span></p>
  </td>
  <td width=487 valign=top style='width:365.25pt;padding:0in 5.4pt 0in 5.4pt'>
  <p class=MsoNormal style='margin-bottom:0in;text-align:justify;text-justify:
  inter-ideograph;line-height:normal'><span lang=RU>Стоимость услуг Исполнителя
  в рамках выбранного Заказчиком Курса. Тарифы публикуются Исполнителем на https://apps.apple.com/kg/app/dr-patris-lectures/id1548938154.</span></p>
  <p class=MsoListParagraph style='margin:0in;text-align:justify;text-justify:
  inter-ideograph;line-height:normal'><span lang=RU>&nbsp;</span></p>
  </td>
 </tr>
 <tr>
  <td width=124 valign=top style='width:93.05pt;padding:0in 5.4pt 0in 5.4pt'>
  <p class=MsoNormal style='margin-bottom:0in;text-align:justify;text-justify:
  inter-ideograph;line-height:normal'><b><span lang=RU>Контент</span></b></p>
  <p class=MsoListParagraph style='margin:0in;text-align:justify;text-justify:
  inter-ideograph;line-height:normal'><span lang=RU>&nbsp;</span></p>
  </td>
  <td width=487 valign=top style='width:365.25pt;padding:0in 5.4pt 0in 5.4pt'>
  <p class=MsoNormal style='margin-bottom:0in;text-align:justify;text-justify:
  inter-ideograph;line-height:normal'><span lang=RU>Сообщения, комментарии и
  т.д., в том числе объекты авторских прав, размещаемые Пользователем на
  платформе.</span></p>
  <p class=MsoListParagraph style='margin:0in;text-align:justify;text-justify:
  inter-ideograph;line-height:normal'><span lang=RU>&nbsp;</span></p>
  </td>
 </tr>
 <tr>
  <td width=124 valign=top style='width:93.05pt;padding:0in 5.4pt 0in 5.4pt'>
  <p class=MsoNormal style='margin-bottom:0in;text-align:justify;text-justify:
  inter-ideograph;line-height:normal'><b><span lang=RU>Подписка </span></b></p>
  <p class=MsoNormal style='margin-bottom:0in;text-align:justify;text-justify:
  inter-ideograph;line-height:normal'><b><span lang=RU>на тариф</span></b></p>
  </td>
  <td width=487 valign=top style='width:365.25pt;padding:0in 5.4pt 0in 5.4pt'>
  <p class=MsoNormal style='margin-bottom:0in;text-align:justify;text-justify:
  inter-ideograph;line-height:normal'><span lang=RU>Это договор между Заказчиком
  и Исполнителем, согласно которому Исполнитель обязуется в течение
  определенного времени предоставлять пользователю набор услуг сервиса в
  соответствии с условиями тарифа, а Заказчик получает право использовать эти
  услуги и обязуется оплачивать их. Автопродление подписки на тариф не
  используется. </span></p>
  <p class=MsoNormal style='margin-bottom:0in;text-align:justify;text-justify:
  inter-ideograph;line-height:normal'><span lang=RU>&nbsp;</span></p>
  </td>
 </tr>
</table>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>&nbsp;</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><b><span
lang=RU>2. Предмет Договора </span></b></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>2.1. Исполнитель обязуется предоставить Заказчику через
информационно-коммуникационную сеть “Интернет” удаленный доступ к Приложению
(далее - “Услуги”), а Заказчик обязуется уплатить Исполнителю вознаграждение за
предоставленный доступ в соответствии с п. 4.8 Договора. Исполнитель
предоставляет Заказчику доступ только к той части Приложения (данным и
командам, необходимым для доступа к Курсу), которая соответствует Курсу,
выбранному Заказчиком.</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>2.2. Без согласования с Исполнителем, доступ не может быть предоставлен
третьему лицу. Приложением имеет право пользоваться только Заказчик с одного
мобильного устройства, пока не истечет срок оплаченной подписки.</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>2.3. Исполнитель размещает перечень Курсов, доступных для прохождения,
в Приложении. Информация о стоимости и содержании Курса доступна Заказчику на
странице выбранного Курса в Приложении. Подробная информация по Курсам
размещена в Приложении под описанием Курсов. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>2.4. Услуги считаются оказанными Исполнителем с момента предоставления
Заказчику доступа к платным Курсам Приложения. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>&nbsp;</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><b><span
lang=RU>3. Правила предоставления доступа к Курсу </span></b></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>3.1. Под предоставлением доступа к Курсу имеется в виду предоставление
доступа к определенной совокупности данных и команд, позволяющих интерактивно
взаимодействовать с частью Приложения</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>3.2. Исполнитель предоставляет Заказчику доступ к Курсу после
регистрации Заказчика в Приложении и оплаты стоимости Услуг в порядке, предусмотренном
п. 4.7 Договора. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>3.4. Содержание Курса может изменяться Исполнителем в одностороннем
порядке, путем увеличения или изменения количества информации в Курсе.</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>&nbsp;</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><b><span
lang=RU>4. Дополнительные Права и обязанности Сторон </span></b></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>4.1. Исполнитель обязан: </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>4.1.1. Осуществлять информационную поддержку Заказчика по вопросам
оказания Услуг и работы Приложения. Все вопросы по поддержке направляются
Заказчиком по электронному адресу: </span>edu<span lang=RU>.</span>diams<span
lang=RU>@</span>gmail<span lang=RU>.</span>com<span lang=RU>. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>4.1.2. В случае обнаружения ошибок/недоработок в технологической части
Приложения, допущенных Исполнителем, либо по вине Исполнителя, своими силами и
за свой счет устранить обнаруженные ошибки/недоработки в разумные сроки.</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>&nbsp;</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><b><span
lang=RU>4.2. Исполнитель вправе: </span></b></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>4.2.1. Без согласования с Заказчиком привлекать третьих лиц для исполнения
настоящего Договора, оставаясь ответственным за действия таких лиц, как за свои
собственные. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>4.2.2. Запрашивать у Заказчика всю необходимую информацию, документы
для надлежащего исполнения обязательств по настоящему Договору. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>4.2.3. Изменять стоимость Услуг. Информация об актуальной стоимости
Услуг доступна Заказчику в приложении «</span>Dr<span lang=RU>. </span>Patris Lectures<span
lang=RU>». Изменение стоимости Услуг в отношении уже оплаченного Заказчиком
доступа к Курсу не производится. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>4.2.4. Приостанавливать работу Приложения для проведения необходимых
плановых профилактических и ремонтных работ на технических ресурсах
Исполнителя. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>4.2.5. Приостановить доступ к Приложению в случае нарушения Заказчиком
настоящего Договора или в случае непредоставления Заказчиком всей необходимой информации,
либо предоставления неполной информации, необходимой для оказания услуг по
Договору в соответствии с законодательством КР. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>4.2.6. Изменять содержание Курса, включая темы отдельных Занятий, их
содержание, количество, длительность, порядок, даты и время добавления новых
Занятий. Информация о таких изменениях доступна Заказчику в Личном кабинете.</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>&nbsp;</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><b><span
lang=RU>4.3. Заказчик обязан:</span></b><span lang=RU> </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>4.3.1. Своевременно и в полном объеме оплатить стоимость Услуг
Исполнителя. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>4.3.2. Своевременно предоставлять полную и достоверную информацию,
необходимую для оказания Услуг (в том числе при регистрации в Приложении). </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>4.3.3. Обеспечить конфиденциальность логина и пароля к личному кабинету
в Приложении </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>4.3.4. Не передавать свой логин и пароль третьим лицам. Передача логина
и пароля третьим лицам станет причиной блокировки доступа Заказчика к Приложению
и удаления из числа авторизированных пользователей без возможности повторного
входа в Приложение. При этом оплаченные за Курс деньги не будут возвращены. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>4.3.5. Следовать правилам Приложения, не пытаться копировать, делать
скриншоты или каким-то другими способами распространять видео-лекции Курса,
которые являются интеллектуальной собственностью Исполнителя. За нарушение
правил следует автоматический бан, и закрытие доступа к Приложению, без
возвращения произведенной оплаты. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>4.3.5. Соблюдать этические нормы поведения при прохождении Курса, в
частности не публиковать в общих чатах сообщения, не относящиеся к тематике
освоения Курса, не допускать неуважительных высказываний и оскорблений в адрес
других Заказчиков, сотрудников Исполнителя, Исполнителя.</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>&nbsp;</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><b><span
lang=RU>4.4. Заказчик вправе: </span></b></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>4.4.1. Приостановить пользование Приложением в любое время по
собственному желанию.</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>4.4.2. Получать информационную поддержку по вопросам, связанным с
порядком оказания Услуг и работой Приложения, на протяжении доступа к Курсу.</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><b><span
lang=RU>&nbsp;</span></b></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><b><span
lang=RU>4.5. Финансовые условия</span></b><span lang=RU> </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>4.6. Стоимость Услуг Исполнителя определяется в соответствии с
Тарифами, указанными в Приложении. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>4.7. Заказчик производит оплату в размере 100% (ста процентов) тарифа
единовременно. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>4.8. Датой исполнения Заказчиком обязательств по оплате услуг
Исполнителя является дата поступления денежных средств на расчетный счет
Исполнителя. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>4.9. При оплате Услуг в Приложении, Заказчик автоматически
перенаправляется на страницу системы приема платежей для внесения оплаты.
Исполнитель не контролирует аппаратно-программный комплекс электронной системы
платежей. Если в результате таких ошибок произошло списание денежных средств
Заказчика, но платеж не был авторизован электронной системой платежей,
обязанности по возврату денежных средств Заказчику лежат на провайдере
электронной системы платежей. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>4.10. Акты об оказании Услуг предоставляются Исполнителем по запросу
Заказчика, направленному Заказчиком на электронную почту Исполнителя </span>edu<span
lang=RU>.</span>diams<span lang=RU>@</span>gmail<span lang=RU>.</span>com<span
lang=RU>. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>&nbsp;</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><b><span
lang=RU>5. Интеллектуальная собственность</span></b><span lang=RU> </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>5.1. Исключительное право на Приложение принадлежат Исполнителю, либо
им получены все необходимые права и разрешения. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>5.2. Заказчик имеет право пользоваться Платформой в рамках
предоставленного функционала и интерактивного взаимодействия с доступной
информацией на все время доступа к Платформе в соответствии с настоящим
Договором. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>5.3. Заказчик обязан:</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU> - воздерживаться от любых действий, которые нарушают права Исполнителя
на результаты интеллектуальной деятельности, в частности, не копировать, не
записывать, не воспроизводить, не распространять любые результаты
интеллектуальной деятельности Исполнителя без письменного разрешения Исполнителя;
</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>- немедленно сообщать Исполнителю о любых ставших известными фактах
нарушения исключительных прав Исполнителя; </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>- не предоставлять свои аутентификационные данные для доступа в Личный
кабинет на Платформе третьим лицам. В случае утраты, а также в случаях
незаконного получения доступа к логину и паролю третьими лицами, Заказчик
обязуется незамедлительно сообщить об этом Исполнителю, путем направления
уведомления по адресу: </span>edu<span lang=RU>.</span>diams<span lang=RU>@</span>gmail<span
lang=RU>.</span>com<span lang=RU>. До момента отправки указанного извещения все
действия, совершенные с использованием Личного кабинета Заказчика, считаются
совершенными Заказчиком. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>5.4. Использование Заказчиком Приложения, ее содержимого и составляющих
(как в целом, так и фрагментарно) и прочих разработанных Исполнителем
технических решений не означает передачи (отчуждения) Заказчику и / или любому
третьему лицу прав на результаты интеллектуальной деятельности, как в целом,
так и в части. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>5.5. К конфиденциальной относится любая информация, относящаяся к
процессу оказания Услуг Исполнителем, неопубликованная в открытом доступе и не
являющаяся доступной для всеобщего сведения. Заказчик обязуется не разглашать
конфиденциальную информацию и иные данные, предоставленные Исполнителем в ходе
оказания Услуг (за исключением общедоступной информации), третьим лицам без
предварительного письменного согласия Исполнителя.</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>&nbsp;</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><b><span
lang=RU>6. Конфиденциальность</span></b><span lang=RU> </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>6.1. К конфиденциальной относится любая информация, относящаяся к
процессу оказания Услуг Исполнителем, не опубликованная в открытом доступе и не
являющаяся доступной для всеобщего сведения. Заказчик обязуется не разглашать
конфиденциальную информацию и иные данные, предоставленные Исполнителем в ходе
оказания Услуг (за исключением общедоступной информации), третьим лицам без
предварительного письменного согласия Исполнителя. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>6.2. В рамках оказания услуг Заказчику может предоставляться доступ к
программному обеспечению сторонних правообладателей, в том числе к внутренним
информационным системам (далее — ПО) через Приложение. В таком случае Заказчик
не может совершать с ПО никаких действий за исключением тех, которые необходимы
для прохождения Курса. Срок предоставления права использования такого ПО
ограничен сроком прохождения Курса. Заказчик обязан сохранять
конфиденциальность сведений в отношении ПО и не вправе разглашать их без
согласия правообладателя такого ПО. Если при этом происходит создание или
переработка какого бы то ни было ПО, Заказчик безвозмездно передаёт
исключительное право на переработанное ПО или созданное ПО Компании,
предоставившей доступ с момента создания или переработки, если иное не было
специально согласовано Сторонами.</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>&nbsp;</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><b><span
lang=RU>7. Ответственность Сторон</span></b><span lang=RU> </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>7.1. Исполнитель несет ответственность в соответствии с
законодательством КР при наличии его вины. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>7.2. Исполнитель не несёт ответственности за качество соединения с
сетью Интернет и функционирование оборудования и программного обеспечения
Заказчика. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>7.3. При неисполнении Заказчиком обязательства, предусмотренного
пунктами 5.3 Договора, и выявлении Исполнителем факта доступа третьих лиц к
содержанию Курса Заказчик обязан во внесудебном порядке по письменному
требованию Исполнителя оплатить штраф в размере 100000 (ста тысяч) сомов за
каждый случай несанкционированного предоставления доступа третьим лицам. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>7.4. В случае нарушения Заказчиком условий Договора Исполнитель вправе
прекратить доступ Заказчика к Личному кабинету, а также заблокировать доступ
Заказчика к Приложению.</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>7.5. Исполнитель не несет ответственности за содержание информации,
размещаемой в чатах мессенджеров («WhatsApp», «Viber», «Telegram»), в том числе
за использование третьими лицами персональных данных, которые Заказчик
оставляет в таких чатах. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>7.6. Платформа и ее программные средства, в том числе Личный кабинет,
предоставляются «Как есть». На Заказчике лежит риск использования Приложения.
Исполнитель не несет ответственности за неисполнение или ненадлежащее
исполнение обязательств по настоящему Договору, а также за возможный ущерб,
возникший в результате: </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>● сбоев в работе Приложения и (или) иного программного обеспечения,
вызванных ошибками в коде, компьютерными вирусами и иными посторонними
фрагментами кода в программном обеспечении; </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>● отсутствия (невозможности установления, прекращения и пр.)
Интернет-соединений; </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>● установления государственного регулирования (или регулирования иными
организациями) хозяйственной деятельности коммерческих организаций в сети и/или
установления указанными субъектами разовых ограничений, затрудняющих или
делающих невозможным исполнение настоящего Договора; </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>● использования (невозможность использования) и какие бы то ни было
последствия использования (невозможности использования) Заказчиком выбранной им
формы оплаты услуг по Договору.</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>&nbsp;</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><b><span
lang=RU>8. Срок действия Договора. Порядок расторжения</span></b><span lang=RU>
</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>8.1. Договор вступает в силу с даты его акцепта Заказчиком. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>8.2. Договор может быть в любое время расторгнут по инициативе
Исполнителя в одностороннем порядке. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>8.3. Договор может быть расторгнут в части доступа к Курсу по
инициативе Исполнителя в одностороннем внесудебном порядке по истечению 3 лет с
момента начала его действия, в случае отсутствия организационной, технической
или юридической возможности предоставлять доступ к этой части Приложения.</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>8.4. Договор может быть в любое время расторгнут в одностороннем
порядке по инициативе Заказчика путем направления Исполнителю уведомления по
электронной почте Исполнителя </span>edu<span lang=RU>.</span>diams<span
lang=RU>@</span>gmail<span lang=RU>.</span>com<span lang=RU> с указанием в ней
причин отказа от Договора. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>8.5. Денежные средства за оплаченный период не возвращаются после
расторжения договора.</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>&nbsp;</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><b><span
lang=RU>9. Изменение условий Договора</span></b><span lang=RU> </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>9.1. Исполнитель вправе в одностороннем порядке изменять условия
Договора, и такие изменения вступают в силу в момент опубликования новой версии
Договора в приложении по адресу https://apps.apple.com/kg/app/dr-patris-lectures/id1548938154.
При этом в части величины Вознаграждения за уже предоставленный доступ старая
версия Договора продолжает действовать для Сторон без изменений. В остальной
части новые положения Договора имеют обратную силу. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>9.2. Использование Приложения или повторный вход в Приложение после
опубликования новой версии Договора будет означать согласие Пользователя с
условиями новой версии Договора. Если Пользователь не согласен с условиями
новой версии Договора, он должен прекратить использовать Приложение или
оплачивать Счета. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>9.3. Заказчик вправе передать свои права и обязанности по Договору
третьей Стороне при условии сохранения доступа Курса только при условии
получения письменного согласия Исполнителя и на основании отдельного
соглашения, заключенного Сторонами. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>9.4. Исполнитель вправе уступать права, переводить долги (в том числе
привлекать субагентов и субподрядчиков) по всем обязательствам, возникшим из
Договора. Настоящим заказчик дает свое согласие на уступку прав и перевод долга
любым третьим лицам. О состоявшейся уступке прав и/или переводе долга
Исполнитель информирует Заказчика, размещая соответствующую информацию в Личном
кабинете.</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>&nbsp;</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><b><span
lang=RU>10. Рассылки и персональные данные</span></b><span lang=RU> </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>10.1. Заказчик дает свое согласие Исполнителю на обработку персональных
данных Заказчика, указанных им при регистрации в Приложении, а также в Личном
кабинете на условиях, предусмотренных Политикой обработки персональных данных.</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>10.2. Заказчик дает согласие на получение от Исполнителя смс-рассылок,
а также иных видов рассылок и уведомлений, информационного характера (устных и
письменных), с использованием любых средств связи, включая но не ограничиваясь
следующими: электронная почта, телефон, почтовые рассылки. Настоящее согласие
может быть в любое время отозвано Заказчиком посредством направления
уведомления по электронной почте Исполнителя </span>edu<span lang=RU>.</span>diams<span
lang=RU>@</span>gmail<span lang=RU>.</span>com<span lang=RU>. С учетом того,
что данное согласие необходимо для корректного исполнения Договора со стороны
Исполнителя и корректного функционирования Приложения, в случае отзыва согласия
по настоящему пункту Исполнитель вправе расторгнуть договор в одностороннем
(внесудебном) порядке или ограничить доступ к Приложению. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU> 10.3. Заказчик дает согласие на получение от Исполнителя смс-рассылок,
а также иных видов рассылок и уведомлений, рекламного характера (устных и
письменных), с использованием любых средств связи, включая но не ограничиваясь
следующими: электронная почта, телефон, почтовые рассылки. Данное согласие
является встречным предоставлением Заказчика за возможность использования
демонстрационной части Приложения, до момента оплаты Курса без взимания
дополнительной платы. Настоящее согласие может быть в любое время отозвано
Заказчиком посредством направления уведомления по электронной почте Исполнителя
</span>edu<span lang=RU>.</span>diams<span lang=RU>@</span>gmail<span lang=RU>.</span>com<span
lang=RU>. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>10.4. Заказчик дает согласие на использование Исполнителем отзывов
Заказчика об Исполнителе и оказываемых им услугах, оставленных Заказчиком в
официальных группах Исполнителя в социальных сетях, в целях размещения таких
отзывов на официальных сайтах Исполнителя, в информационных и рекламных материалах
Исполнителя. Настоящее согласие действует с даты заключения Договора. Настоящее
согласие может быть отозвано Заказчиком в любой момент путем направления
письменного заявления по электронной почте Исполнителя </span>edu<span lang=RU>.</span>diams<span
lang=RU>@</span>gmail<span lang=RU>.</span>com<span lang=RU>.</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>10.5. Заказчик даёт свое согласие Исполнителю на обнародование и
дальнейшее использование изображения Заказчика в фото-, видеоматериалах, равно
как и зафиксированного в независимых друг от друга кадрах таких
видеоматериалов, а также зафиксированного в любых иных объектах изображении в
целях размещения такого изображения на официальных сайтах Исполнителя, в
информационных и рекламных материалах Исполнителя и любых иных целях, связанных
с деятельностью Исполнителя и не противоречащих действующему законодательству.
Настоящее согласие действует с даты заключения Договора и распространяется на
любые объекты, созданные Исполнителем в период доступа к Приложению Заказчиком,
а также полученные от Заказчика в этот период. Настоящее согласие может быть
отозвано Заказчиком в любой момент путем направления письменного заявления по
электронной почте Исполнителя </span>edu<span lang=RU>.</span>diams<span
lang=RU>@</span>gmail<span lang=RU>.</span>com<span lang=RU>. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>&nbsp;</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><b><span
lang=RU>11. Порядок разрешения споров</span></b><span lang=RU> </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>11.1. В случае возникновения любых разногласий между Заказчиком и
Исполнителем относительно исполнения каждой из сторон условий Договора, а также
любых иных разногласий, такие разногласия должны быть урегулированы с
применением обязательного досудебного претензионного порядка. Исполнитель
обязуется направить Заказчику претензию в электронном виде на адрес электронной
почты, указанный Заказчиком при регистрации в Приложении. Заказчик обязуется
направить Исполнителю претензию в электронном виде на адрес электронной почты </span>edu<span
lang=RU>.</span>diams<span lang=RU>@</span>gmail<span lang=RU>.</span>com<span
lang=RU>. Срок ответа на претензию - 15 (пятнадцать) рабочих дней со дня ее
получения. Если Законодательством КР установлен меньший срок, то применяется
срок, установленный законодательством. При несоблюдении любой из сторон всех перечисленных
выше условий обязательный претензионный порядок не считается соблюденным.</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>&nbsp;</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><b><span
lang=RU>12. Уведомления и электронный документооборот</span></b><span lang=RU> </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>12.1. Если иное не предусмотрено в Договоре или действующим
законодательством, любые уведомления, запросы или иные сообщения
(корреспонденция), представляемые Сторонами друг другу, должны быть оформлены в
письменном виде и направлены получающей Стороне по почте, путем направления
заказной корреспонденции, по электронной почте (на адрес и (или) с адреса
Исполнителя, указанного в разделе 14 Договора на адрес и (или) с адреса
Заказчика, указанного при регистрации в Приложении) или при помощи курьерской
службы. Датой получения корреспонденции считается дата получения уведомления о
доставке почтового отправления, в том числе заказной корреспонденции,
электронного подтверждения доставки при отправлении электронной почтой (или в
отсутствии такового – момент отправления сообщения), или день доставки в случае
отправления корреспонденции с курьером. При рассмотрении споров в суде переписка
Сторон по электронной почте, а также переписка через Личный кабинет будут
признаны Сторонами достаточными доказательствами. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>12.2. При исполнении (изменении, дополнении, прекращении) Договора, а
также при ведении переписки по указанным вопросам допускается использование
аналогов собственноручной подписи Сторон. Стороны подтверждают, что все
уведомления, сообщения, соглашения и документы в рамках исполнения Сторонами
обязательств, возникших из Договора, подписанные аналогами собственноручной
подписи Сторон, имеют юридическую силу и обязательны для исполнения Сторонами.
Под аналогами собственноручной подписи понимаются уполномоченные адреса
электронной почты и учетные данные к Личному кабинету. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>12.3. Стороны признают, что все уведомления, сообщения, соглашения,
документы и письма, направленные с использованием уполномоченных адресов
электронной почты и Личного кабинета, считаются направленными и подписанными
Сторонами, кроме случаев, когда в таких письмах прямо не указано обратное. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>12.4. Уполномоченными адресами электронной почты Сторон признаются: </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>· Для Исполнителя: </span>edu<span lang=RU>.</span>diams<span lang=RU>@</span>gmail<span
lang=RU>.</span>com<span lang=RU> или иной, указанный в Договоре </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>· Для Заказчика: адрес электронной почты, указанный при регистрации в
Приложении. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>12.5. Стороны обязуются обеспечивать конфиденциальность сведений и
информации, необходимых для доступа к уполномоченным адресам электронной почты
и Личному кабинету, не допускать разглашение такой информации и передачу
третьим лицам. Стороны самостоятельно определяют порядок ограничения доступа к
такой информации. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>12.6. До момента получения от Заказчика информации о нарушения режима
конфиденциальности все действия и документы, совершенные и направленные с
помощью уполномоченного адреса электронной почты Заказчика и Личного кабинета,
даже если такие действия и документы были совершены и направлены иными лицами,
считаются совершенными и направленными Заказчиком. В этом случае права и
обязанности, а также ответственность наступают у Пользователя. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>12.7. До момента получения от Сервиса информации о нарушения режима конфиденциальности,
все действия и документы, совершенные и направленные с помощью уполномоченного
адреса электронной почты Сервиса, даже если такие действия и документы были
совершены и направлены иными лицами, считаются совершенными и направленными
Сервисом.</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>&nbsp;</span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><b><span
lang=RU>13. Прочие условия</span></b><span lang=RU> </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>13.1. Заказчик вправе передать свои права и обязанности по Договору
третьей Стороне при условии сохранения доступа к Курсу только при условии
получения письменного согласия Исполнителя и на основании отдельного
соглашения, заключенного Сторонами. </span></p>

<p class=MsoNormal style='text-align:justify;text-justify:inter-ideograph'><span
lang=RU>13.2. Недействительность одного из условий договора не влечет
недействительности всего Договора в целом. В случае признания условия Договора
недействительным, стороны обязаны вступить в переговоры и изменить договор
таким образом, чтобы он продолжил свое действие. 13.3. Во всем остальном, что
не урегулировано Договором, Стороны руководствуются действующим
законодательством Кыргызской Республики без учета его коллизионных норм.</span></p>

<p class=MsoNormal style='margin-bottom:0in;text-align:justify;text-justify:
inter-ideograph'><b><span lang=RU>&nbsp;</span></b></p>

<p class=MsoNormal style='margin-bottom:0in;text-align:justify;text-justify:
inter-ideograph'><b><span lang=RU>14. Реквизиты Исполнителя</span></b><span
lang=RU> </span></p>

<p class=MsoNormal style='margin-bottom:0in;text-align:justify;text-justify:
inter-ideograph'><span lang=RU>Исполнитель: ОсОО «Образовательный центр «ДАЙМС»
</span></p>

<p class=MsoNormal style='margin-bottom:0in;text-align:justify;text-justify:
inter-ideograph'><span lang=RU>Адрес (местонахождение): </span></p>

<p class=MsoNormal style='margin-bottom:0in;text-align:justify;text-justify:
inter-ideograph'><span lang=RU>720020, г. Бишкек, ул. Байтик Баатыра, 6/1</span></p>

<p class=MsoNormal style='margin-bottom:0in;text-align:justify;text-justify:
inter-ideograph'><span lang=RU>код ОКПО 29990578  /   ИНН 00407201710112 </span></p>

<p class=MsoNormal style='margin-bottom:0in'><span lang=RU>р/счет 1033820000043475
</span></p>

<p class=MsoNormal style='margin-bottom:0in'><span lang=RU>Банк: ФОАО
&quot;КОММЕРЧЕСКИЙ БАНК КЫРГЫЗСТАН&quot; &quot;МЕДАКАДЕМИЯ&quot;</span></p>

<p class=MsoNormal style='margin-bottom:0in'><span lang=RU>ИНН банка:
41512201610024   /  БИК: 103038</span></p>

</div>

</body>

</html>

        `);
    }
    else {
        res.send(`


        Please read the following terms and conditions of use ("Terms of Use") of the services (as defined in Clause 2.1 below) made available on Dr. Patris lectures Mobile Application available on Google Play or Apple Store ("Dr. Patris lectures"). The Dr. Patris Lectures App on which the Services are availed may together be referred to for convenience as the "Platform".
        For the purpose of these Terms of Use, wherever the context so requires "Your", "You" or "User" shall mean any natural or legal person who browses the Platform or has agreed to become a subscriber to the Services on the Platform by providing login credentials while registering on our Platform as a Subscribed User (defined below). The term "We", "Us", "Our" shall mean Dr. Patris Lectures Company.
        When You use the Platform, You will be subject to these Terms of Use. We may update these Terms of Use from time to time and will endeavour to notify You of such changes at the earliest. Please ensure You read our Terms of Use and any updated version thereof before proceeding to use the Platform or the Services, as the case maybe.
        Acceptance of Terms
        These Terms of Use set forth a legally binding contract between Us, and You, the user. By using the Platform, You agree to be bound by all the conditions stated herein. Even if You only review any of the service offerings made available by Us, You will be bound by these Terms of Use. If You do not accept these Terms of Use, You must not use the Platform.
        In consideration of your use of the App, You agree :
        (a) To provide true, accurate, current and complete information about yourself complying with Clause 2 of this Terms and Conditions and as prompted in order to generate the login credentials;
        (b) To the responsibility of ensuring that You meet the required qualification while opting for the Pro Account (defined hereunder);
        (c) To maintain and promptly update your login credentials to keep it true, accurate, current and complete
        (d) And acknowledge that Dr. Patris Lectures is not responsible to ensure that You Conform to the eligibility criteria;
        (e) To seek the consent of Your parents/legal guardians before providing any Information about Yourself or Your parents and other family members on the Dr. Patris Lectures App.
        (f) That We are not responsible for any consequence that arises as a result of misuse of any kind in the Dr. Patris Lectures App or any of Our Services
        If You provide any information that is untrue, inaccurate, not current or incomplete, or we have reasonable grounds to suspect that such information is untrue, inaccurate, not current or incomplete, We reserve the right to suspend or terminate your account and refuse any and all current or future use of the Platform.
        This document is an electronic record in terms of the Information Technology Act, 2000 ("IT Act"), the rules thereunder as applicable, and the provisions pertaining to electronic records in various statutes as amended by the IT Act. This electronic record is generated by a computer system and does not require any physical or digital signatures.
        You may subscribe to the Services only for Your personal use. The Platform as a whole, is owned exclusively by Dr. Patris Lectures Company. You acknowledge that Dr. Patris Lectures is providing You with a revocable, limited, non-exclusive, and non-transferable license to use the features of the App. You will upon logging into the App as a regular user be entitled to view Our limited free content as a demo of the offerings. You will get access to once You enrol as a Subscriber. You are advised to review this free content before taking the decision to proceed to subscribe to the Services as a Subscribed User as defined in clause 1.7.
        By registering Your e-mail address and/or phone number with Us, You consent to be contacted by Us via phone calls, SMS notifications, and/or e-mails, in case of any subscription or Service updates.
        You are entirely responsible for maintaining the security and confidentiality of Your account as well as the login credentials to the account once you become a Subscribed User.
        We will not be liable for any loss that You may incur because of someone else using Your account, either with or without Your knowledge. You may be held liable for any losses incurred by Us or another party due to someone else using Your account.
        Due to the global nature of the Internet, You agree to comply with all applicable local laws, state specific laws, and regulation rules regarding use of the Website. Specifically, You agree to comply with all applicable laws regarding the transmission of technical data and information, exported from Turkey or the country in which You reside.
        Eligibility
        Persons who are "competent/capable" of contracting shall be eligible (determines the circumstances in which promises made by the parties to a contract shall be legally binding) to register for Dr. Patris Lectures App and be a Registered User (defined hereunder). Persons who are minors are not eligible to register for Our Services. As a minor if You wish to use the Dr. Patris Lectures App or Our Services, such use shall be made available to You by Your legal guardian or parents, who has agreed to these Terms. In the event a minor utilizes the Dr. Patris Lectures App/Services, it is assumed that he/she has obtained the consent of the legal guardian or parents and such use is made available by the legal guardian or parents...
        To register on the Platform for availing the Services (as defined in Clause 3.1 below) on an account login based paid subscription ("Subscriber"/ "Subscribed User"), You will be required to give details to validate your eligibility by filling in all mandatory fields in the online Service subscription enrolment form.
        Subsequent to You completing all fields in the Service subscription form, you will have access to the free content or the Basic Plan in the capacity of Registered User and have the option to purchase a paid subscription of your choice. If You choose to purchase a paid subscription, You will be directed to the purchase page and select the Services and duration for which You wish to become a Subscribed User. Post registration, only once the payment has been received by Dr. Patris Lectures Company, will You attain the status of a Subscribed User or as Pro User. After the payment is complete, You will receive a confirmation email to the registered email id confirming your plan details and credentials for accessing the Platform.
        Services of Dr. Patris Lectures App
        To avail the full range of course content offered as part of the Services, You will have to mandatorily be a Subscribed User meeting all the requirements set out in Clause 2.2 The Services and amounts payable to access the Services may differ for different Subscribed Users and will be based on the course combination chosen by You either at the time of enrolling as a Subscribed User or thereafter based on the courses a Subscribed User adds through his/ her account. In these Terms of Use, the term "Services" shall mean and include without limitation, the online tutorial videos and content as well as study materials that will be accessible to You as a Subscribed User and will exclude the free demo content that is accessible to all Registered Users visiting the Platform. The foregoing meaning and scope of Services may be subject to change and the definition shall not in any way limit or restrict Our right to remove or add features to the Platform.
        As a "Registered User", You are enrolled to the free plan by default and have the option to purchase a Pro Services Account ("Pro Account") and become a Subscribed User.
        You agree that any Services provided by Dr. Patris Lectures may be subject to change at the discretion of Dr. Patris Lectures and Dr. Patris Lectures may add, remove or modify offerings to its existing scope of Services at such fees as will be solely determined by Dr. Patris Lectures Company.
        Dr. Patris Lectures may at its discretion revise the amount payable in respect of existing offerings forming part of the Services that may be made available to You.
        You agree that Dr. Patris Lectures may at any time and for any reason, terminate Your access to whole or part of the Platform, or restrict or suspend Your access to your Subscribed User account, for any or no reason, with or without prior notice, and without any liability to You.
        Subscriber Account, Password and Security
        If You use the Platform and wish to avail Services by creating a User account, You may be required to submit your phone number and/or email ID and choose a password which will be the only set of credentials basis which You will be granted access to the Platform and its Services. You are responsible for maintaining the confidentiality of Your password and other credentials to access the Services. If there is any compromise to Your account, You can change your password using the "forgot password" functionality available on the login page used to access the Platform.
        Third Parties
        We may use/integrate another third party's platform on Our Dr. Patris Lectures App. We may also use third party platforms to provide services to ourselves. In such event, You will be bound by such third party's terms and conditions, privacy policy, and any other applicable policies. You also agree and hereby authorize Dr. Patris Lectures to share Your details and personal information with such third parties to the extent necessary for Dr. Patris Lectures to deliver the Services to You.
        Payment Terms
        Any payments made to Dr. Patris Lectures in respect of Services are subject to the payment terms of Dr. Patris Lectures as will be notified to You once You initiate the process to become a Subscribed User.
        The Fee including GST and any delivery charges payable in relation to delivery of hard copy or electronic versions of document based Study materials, if applicable, will be shown prior to completion of the online payment transaction.
        In the unlikely event that, due to a technical error, the amount of the Fee displayed on the Platform is incorrect, Dr. Patris Lectures will notify You as soon as it reasonably can. If the correct amount of the Fee is higher than the amount displayed on the Platform, Dr. Patris Lectures will contact You through your registered e-mail address and/or phone number to notify You of the correct Fee. To avail all Services for the duration of Subscription, You may be required to remit any additional fees such that the correct Fee is paid by you.
        Dr. Patris Lectures hereby notifies You that Dr. Patris Lectures uses third party payment gateway service providers to process payment made by You towards the Service subscription. It is hereby clarified that Dr. Patris Lectures will not be responsible for any payment failures or errors occurring due to technical issues at the bank's end or issues arising from the third payment gateway and all such issues should be resolved directly between You and the banking or payment gateway partner concerned.
        The provision of the online tutorials forming part of the Services are contingent upon Dr. Patris Lectures having received cleared funds from You in respect of the Fee for the relevant Service subscription. Without prejudice to Dr. Patris Lectures Company's rights and remedies under these Terms of Use, if any sum payable is not paid on or before the due date, Dr. Patris Lectures reserves the right, forthwith and at Dr. Patris Lectures Company's sole discretion, to suspend Your access to the Services and refuse You entry to the course You intended to avail as part of the subscription to the Platform.
        Disclaimer as regards Study materials
        The term "Study Materials" as used in these Terms of Use include the videos, question bank, test series and any other learning material posted for the specific topics as well as other hard copy or electronic materials that maybe made available from time to time. Sometimes soft copy document versions of the video lectures maybe provided to a Subscribed User basis Dr. Patris Lectures Company's sole assessment as regards the need for such material. Where soft copy Study Materials accompany the Services, these study materials will be made available to You, upon meeting all the conditions stipulated in these Terms of Use and You becoming a Subscribed User.
        Dr. Patris Lectures does not make any representation, guarantee or commitment to You that the Study Materials offered either in the demo versions or as part of subscribed Services will be error free.
        The Services and all accompanying Study materials are only offered purely on "AS IS" basis and Dr. Patris Lectures expressly states that the Study Material and the Services are not intended to act as a substitute for professional medical opinion on ailments.
        Dr. Patris Lectures Company does not claim any guaranteed rank, mark or success with the use of " Dr. Patris Lectures" platform.
        Online Subscription and Access Terms
        Except as set out in the description of the subscription model available on the Platform, no additional study materials and/or video tutorials will be provided by Dr. Patris Lectures Company.
        Upon receipt of a confirmation e-mail from Dr. Patris Lectures you will be notified when You (only as a Subscribed User) have access to purchased Services and for the length of time such access will be made available to You, subject however to Dr. Patris Lectures Company’s absolute right to suspend or terminate access in accordance with these Terms of Use.
        A subscription received is personal to You and You shall not transfer or share your right to access the Study Material or further sell the subscription or allow access to the subscription to any other person for consideration or otherwise.
        System Requirements
        Please note that it is Your responsibility to check that device You plan to use to access the subscription is compatible with the minimum specification requirement that relates to the subscription You are opting for. You acknowledge and accept that Dr. Patris Lectures cannot be held responsible for any technical problems (including but not limited to playback of video content) with any systems, computers or devices You encounter following the commencement of the subscription.
        Minimum System Requirements:
        Android 6.0 - Non-rooted - DRM supported devices
        iOS 10.0 - Non-jailbroken
        Minimum Internet Speed:
        For Videos = 0.8Mbps
        For other Services = 0.2Mbps
        Recommended Internet Speed:
        For Videos = 0.8Mbps
        For other Services = 2Mbps
        Modifications to Subscription
        From time to time, Dr. Patris Lectures may make modifications, enhancements or issue clarifications (for example, clarification of doubt, interactive sessions) to the subscription, including but not limited to changes in Services, number of Services available, pricing and validity of Subscription duration.
        Technical Support and Access
        Dr. Patris Lectures does not warrant uninterrupted or error-free operation of the subscription.
        Dr. Patris Lectures is not obliged to offer You any technical support in relation to your subscription other than the specific support that has been included as part of the subscription plan You have opted for.
        You also accept and acknowledge that Dr. Patris Lectures cannot be held responsible for any delay or disruptions to your subscription as a result of such suspension or any of the following but not limited to:
        the operation of the internet and the World Wide Web, including but not limited to viruses;
        any firewall restrictions that have been placed on your network or the computer You are using to access the Services;
        failures of telecommunications links and equipment; or
        updated browser issues
        DRM protocols preventing playback of media
        Not meeting standards any of the minimum system requirements as defined in clause 8.
        Disclaimer of Warranties and Liabilities
        We shall not be liable for any interference, virus, hacking, or any such consequence, caused by any network or internet service providers and failure of device manufacturers to support DRM protocols.
        Any content posted on a third-party platform, by Us or any authorised third party, shall be subject to the terms and conditions, and policies, of that third-party platform in addition to the terms and conditions set forth herein.
        Subject to applicable laws, in no event will Dr. Patris Lectures or its employees', or its agents', partners, and contractors', aggregate liability arising from or related to the aforesaid services to you, exceed the payments actually received and retained by Dr. Patris Lectures from you, for any and all causes of action brought by you or your agents. in the event that you are not a subscribed user, Dr. Patris Lectures will not be liable to you under any circumstances.
        Disclaimer of Services
        Any information provided to You through the Platform, should not be treated as medical advice, opinion, diagnosis, prescription, or treatment. You acknowledge that We have not been authorized or recognized by any regulatory body or medical council to give any sort of medical advice, opinion, diagnosis, prescription or treatment. You also understand that the Services provided to You shall not be construed as medical classes and Dr. Patris Lectures Company’s Services do not come within the purview of medical training as regulated and recognized by Turkish Medical Association or other regulatory bodies.
        You acknowledge and agree that the suggestions and recommendation provided by Us on the Platform, are only suggestions, and You may comply with it at Your choice and option. Dr. Patris Lectures offers You various services via the Platform, to help You prepare for medical entrance examinations with customised support and assistance.
        Data protection
        Dr. Patris Lectures will process the information it receives from You or otherwise holds about You in accordance with these Terms of Use and the Privacy Policy. You consent to the use by Dr. Patris Lectures of such information in accordance with these Terms of Use and Dr. Patris Lectures Company’s Privacy Policy.
        You acknowledge that Dr. Patris Lectures may conduct online surveys from time to time. The data collected through these surveys are used to gauge our service, collect demographic information and other information that we may find useful. We may share non-personal, aggregated information with third parties. By agreeing to these Terms of Use, You agree to Dr. Patris Lectures using your information in this manner.
        Prohibited Conduct
        You agree that You shall not use the Services or the App in order to host, display, upload, modify, publish, transmit, update, distribute, share, store material. You are bound not to cut, copy, distribute, modify, recreate, reverse engineer, distribute, disseminate, post, publish or create derivative works from, transfer, or sell any information or software obtained from the website. With our prior permission limited use may be allowed. For the removal of doubt, it is clarified that unlimited or wholesale reproduction, copying of the content for commercial or non-commercial purposes and unwarranted modification of data and information within the content of the App is not permitted.
        (a) in violation of any applicable law or regulation;
        (b) in a manner that will infringe the copyright, trademark, trade secret or other intellectual property or proprietary rights of others or violate the privacy, publicity or other personal rights of others;
        (c) that belongs to another person and to which the user does not have any right to;
        (d) that is grossly harmful, harassing, blasphemous, defamatory, obscene, pornographic, paedophilic, libellous, invasive of another's privacy, threatening, abusive or hateful or racially, ethnically objectionable, disparaging, relating encouraging money laundering or gambling or otherwise unlawful in any manner whatsoever;
        (e) that harms minors in any way;
        (f) that impersonate another person or entity;
        (g) that contains software viruses or any other computer code, files or programs designed to interrupt, destroy or limit the functionality of Dr. Patris Lectures Company’s computer systems or Dr. Patris Lectures Company’s Users, customer's computer systems;
        (h) threatens the unity, integrity, defence, security or sovereignty of India and any other countries, friendly relations with foreign states or of public order or causes incitement to the commission of any cognizable offence or prevents investigation of any offence or insulting any other nation.
        If You become aware of misuse of the Service by any person, please contact us.
        You shall not either as a regular browsing user, Basic Plan user, or as a Subscribed User use the Platform to either directly or indirectly either alone or with another third party disassemble, reverse engineer or decompile any part or whole of the Platform in order to get access or attempt to get access to the underlying software, source or proprietary technology which enables the Services or other functionalities of the Platform or do anything with an intent to create derivative works or competing platforms that provide same or similar services.
        You shall not either directly or through other third parties take, post, publish, transmit or otherwise make available any of the Study Material or video tutorials on any other medium. Further, You undertake not to use, display, mirror or frame the Platform or any individual element within the Platform.
        You shall not copy or record or make any attempt to copy or record part or whole of the Services or use the Services for further distribution any mode so as to commercially benefit from the Study Material or engage in any form of piracy.
        Termination or Suspension of Account for Illegalities or suspected Illegalities
        If there is a suspicion of untoward or illegal activity, we may suspend your account immediately and if required, debar all future access by You to the Platform.
        Dr. Patris Lectures reserves the right to cancel any subscription it believes has been compromised, or is being used fraudulently, at its own discretion without any financial liability to You.
        User's account will be Blocked for the following reasons ( but not limited to):
        (a) If found suspicious (High/ Suspicious Activity)
        (b) Usage of Rooted/ Jail-broken Devices, Emulators, Chrome Cast, Android TV, Amazon Fire 3)TV/ Smart TV/ Apple TV or any other virtual machines.
        (c) Screen Casting, Screen Recording, Screen Mirroring
        (d) Using a camera, phone or any other device to record any Platform content
        (e) Sharing Dr. Patris Lectures Screen Shots in Social Media or any other Network.
        (f) Sharing Dr. Patris Lectures Accounts Credentials with anyone.
        (g) Usage of Multiple Devices (Other than up to Two Devices for Personal Use)
        (h) Abusing Dr. Patris Lectures Faculties.
        (i) Try to sell Dr. Patris LecturesPro Accounts and Contents.
        Preservation/Disclosure
        You acknowledge, consent and agree that Dr. Patris Lectures may access, preserve and disclose Your account information if required to do so by law or in a good faith belief that such access, preservation or disclosure is reasonably necessary to:
        (a) comply with legal process nationally or internationally;
        (b) enforce this Agreement;
        (c) respond to claims that any content violates the rights of third parties;
        (d) protect the rights, property or personal safety of Dr. Patris Lectures Company, its subscribers and the public;or
        (e) pursuant to the terms of the Privacy Policy, reach You for marketing or promotional purposes through any channel.
        Security Components
        You understand that Dr. Patris Lectures and software embodied within Dr. Patris Lectures and the Services you access may include security components that permit digital materials including the Study Materials to be protected, and that use of these Study Materials is subject to usage rules set by Dr. Patris Lectures Company. You shall not attempt to override, disable, circumvent or otherwise interfere with any such security components, encryptions and usage rules embedded into the specific Services accessible through Your Service account.
        Proprietary Rights
        All materials on App, including, without limitation, names, logos, trademarks, images, text, columns, graphics, videos, photographs, illustrations, artwork, software and other elements (collectively, "Material") are owned and controlled by Dr. Patris Lectures Company. You acknowledge and agree that all Material on Dr. Patris Lectures is made available for limited, non-commercial, personal use only. Except as specifically provided herein or elsewhere in Dr. Patris Lectures Company, no Material may be copied, reproduced, republished, sold, downloaded, posted, transmitted, or distributed in any way, or otherwise used for any purpose, by any person or entity, without Dr. Patris Lectures Company’s prior express written permission. You may not add, delete, distort, or otherwise modify the Material. Any unauthorized attempt to modify any Material, to defeat or circumvent any security features, or to utilize Dr. Patris Lectures or any part of the Material for any purpose other than its intended purposes is strictly prohibited.
        Dr. Patris Lectures and Third Parties
        All the tutors in the tutorial videos You access as part of the Services You use or subscribe for are independent third parties and not employees of Dr. Patris Lectures Company. The professional and technical information contained in the video tutorial are the sole responsibility of the Tutor. Even though Dr. Patris Lectures reviews content hosted as part of the Services on a best effort basis, Dr. Patris Lectures disclaims all warranties as regards the authenticity or correctness of information communicated to You by the tutors and Dr. Patris Lectures does not guarantee that the tutor videos contain updated information on the subject matter.
        The App may contain links to other apps or web pages owned by third parties (i.e. advertisers, affiliate partners, strategic partners, or others). We are not responsible for examining or evaluating, and we do not warrant the products or offerings of, any of these businesses or individuals, or the accuracy of the content of their website. Dr. Patris Lectures does not assume any responsibility or liability for the actions, product, and content of any such apps. Before You access or visit any third party app or website, You should review website terms of use and policies for such app or web pages. If You decide to access any such third party platform, You do so at your own risk. The hosting of such links to third party content cannot under any circumstances be construed as Dr. Patris Lectures Company endorsement of such third parties and You shall not implead Dr. Patris Lectures in any suit or claim involving You and such third parties.
        Trademark, Copyright and Restriction
        Dr. Patris Lectures provides You with a single limited license to use and access Website and Materials hosted as part of the subscribed Services on devices which Dr. Patris Lectures has permitted access at the time of Your subscription to the Services for the limited purpose of accessing the tutorial or associated Study Materials online. The license is specifically personal, non-transferable, and non-exclusive. All content on website or the App, which is including, but not limited to, designs, text, graphics, images, information, logos, button icons, software, audio files and any other similar content are the exclusive and sole property of Dr. Patris Lectures Company.
        All icons and logos are proprietary to Dr. Patris Lectures Company. The unauthorized copying, modification, use or publication of these marks is strictly prohibited.
        All material on the Platform, including images, illustrations, audio clips, video clips and third-party licensed images are solely for your personal, non-commercial use. You must not copy, reproduce, republish, upload, post, transmit or distribute such material in any way, including by e-mail or other electronic means, whether directly or indirectly and You must not assist any other person to do so. Without the prior written consent of Dr. Patris Lectures Company, modification of the Content, use of the Content on any other website, app or networked computer environment or use of the materials for any purpose other than personal, non-commercial use is a violation of the copyrights, trademarks and other proprietary rights, and is prohibited.
        At all times, Dr. Patris Lectures and/or its licensors, remain the owner of the intellectual property in the tutorial, and the study materials. No Course and/or study materials nor any part thereof may be reproduced, stored in a retrieval system or transmitted any form or by any means without the prior written permission of Dr. Patris Lectures Company.
        Terms and Termination
        This Agreement shall remain in full force and effect for so long as You use Dr. Patris Lectures. You may terminate your subscription at any time, for any reason, by contacting the Support channels as mentioned in Clause 15 .2. Dr. Patris Lectures however does not offer any refunds because of Your termination or discontinuation of the Services. Any termination or Subscription modifications initiated by You are subject to the Policy as mentioned under Cancellation Policy.
        Dr. Patris Lectures reserves the right to terminate Your services without prior notice. Your account or Your access to Dr. Patris Lectures will be terminated immediately, with or without notice to You, and without liability to You, if Dr. Patris Lectures believes that You have breached any of covenants, conditions, restrictions or limitations contained in these Terms of Use or the Privacy Policy, or any false or misleading information, or interfered with use of Dr. Patris Lectures by others.
        Disclaimer of Warranties and Liability
        All Content on the Platform, (including but not limited to software) and Services, included on or otherwise made available to You across all mediums are provided on permitted number of views basis on a limited number of whitelisted devices without any representation or warranties, express or implied except otherwise specified in writing. Without prejudice to the forgoing paragraph, Dr. Patris Lectures does not warrant that:
        i). Platform will be constantly available or;
        ii). The information made available through the Services on the Platform is complete, true or accurate.
        Dr. Patris Lectures is not responsible to You for any data that You lose either (a) as a result of accessing the tutorial, or (b) as a result of accessing study materials, or (c) otherwise during the course of subscription. It is your responsibility to ensure that You regularly save and back up (i) all data which You hold on the computer from which You are accessing the Services and (ii) all data that You are inputting when completing a study module being offered.
        Dr. Patris Lectures will not be held responsible for any delay or failure to comply with its obligations under these Terms if the delay or failure arises from any causes which is beyond Dr. Patris Lectures Company’s reasonable control.
        Each provision in these Terms of Use shall be construed separately as between You and Dr. Patris Lectures Company. If any part of these Terms of Use are held to be unreasonable, inapplicable, or unenforceable, but would be valid if some part thereof was deleted, such provision shall apply but with such modification as may be necessary to make it valid and effective.
        The tutorials are for personal training and for knowledge enhancement purposes only. Dr. Patris Lectures will not any responsibility to any party for the use of the Services provided and/or the contents of the Study materials for any purpose other than training for educational purposes, including but not limited to the giving of advice by You to any third party. Dr. Patris Lectures shall not be responsible for any claims that may arise as a direct or indirect consequence of any third party placing reliance and acting upon the information obtained as part of the Services or Your advice to a third party basis the Study Material or tutorial videos or any other Services.
        Indemnity
        You agree to defend, indemnify and hold harmless Dr. Patris Lectures Company, its subsidiaries, affiliates, subcontractors, officers, directors, employees, consultants, representatives and agents, from and against any and all claims, damages, obligations, losses, liabilities, costs or expenses (including but not limited to attorneys' fees and costs) arising from:
        (i) your use of and access to the Website;
        (j) third party claims from Parties who rely on your representations to them basis the information made available through the Services;
        (k) your violation of any conditions in the Terms of Use and the Privacy Policy; or
        (l) your violation of any third party right, including without limitation any copyright, property, or privacy right.
        Additional Terms
        We reserve the right at any time to modify, edit, delete, suspend or discontinue, temporarily or permanently the Service or Platform (or any portion thereof) with or without notice. You agree that we will not be liable to You or to any third party for any such modification, editing, deletion, suspension or discontinuance of website.
        This Agreement and any rights and licenses granted here under, may not be transferred or assigned by You, but may be assigned by Dr. Patris Lectures without restriction.
        These Terms of Use together with the Privacy Policy as well as subscription details such as pricing tables and any other legal notices published by Dr. Patris Lectures on the Platform, shall constitute the entire agreement between You and Dr. Patris Lectures concerning the Platform and governs your use of the Service and use of the Platform, superseding any prior agreements between You and Dr. Patris Lectures with respect to the subject matter covered in these Terms of Use.
        The failure of Dr. Patris Lectures to exercise or enforce any right or provision of these Terms shall not constitute a waiver of such right or provision. If any provision of these Terms is found by a court of competent jurisdiction to be invalid, the parties nevertheless agree that the court should endeavour to give effect to the parties' intentions as reflected in the provision, and the other provisions of this Agreement remain in full force and effect.
        These Terms are governed by the laws of Turkey. Any matters arising under these terms shall be subject to the exclusive jurisdiction of courts located in Ankara.
        Grievances
        In case of any grievance arising from the use of Platform, please contact:med.patris@gmail.com

        The Customer (end-user) agrees to the transferral of their data related to the payment methods, membership and orders to iyzico Ödeme Hizmetleri A.Ş. (“iyzico”) and agrees to the processing and storage of these data by iyzico in order to finalize the payment transactions and to enable prevention, investigation and detection of fraudulent transactions as described in the most current version of the Privacy Policy at https://www.iyzico.com/en/privacy-policy/




        Müşteri (son kullanıcı), ödeme yöntemine, üyeliğine ve siparişine ilişkin bilgilerin, ödemenin gerçekleştirilebilmesi ve ödeme usulsüzlüklerinin önlenmesi, araştırılması ve tespit edilmesini temin amacıyla iyzico Ödeme Hizmetleri A.Ş.’ye aktarılmasına ve iyzico tarafından https://www.iyzico.com/gizlilik-politikasi/ adresindeki Gizlilik Politikası’nın en güncel halinde açıklandığı şekilde işlenmesine ve saklanmasına rıza göstermektedir.
`)
    }
}

module.exports = { termsAndCondition, getScreenShotRemains, takeScreenShot, registerUser, logOut, login, getVideo, getAllVideos, getCategory, getAllCategories, getAllVideoParts, getVideoPart, refreshToken, changeUserProfile, isUserSubscribed, changePassword, sendMail, forgetPassword, watchedInfo, getWatchedInfo, paymentForm, paymentCallBack, getListCombo, getSuggestedVideos };
