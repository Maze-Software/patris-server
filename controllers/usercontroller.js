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
        const user = await User.findOne({ email: userResult.email })
        if (user) {
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
                            "Email": "ledmago@gmail.com",
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

const paymentForm = async (req, res) => {
    if (config.appstoreReview) {
        res.send("Payment is disabled, We are working on app store in-app purchases system");
        return;
    }

    res.send("ödeme sayfası")
}
var base64 = require('base-64');
var crypto = require('crypto');
const paymentCallBack = async (req, res) => {
    const osbUsername = "623117c770a29cbfd0215f36982c47f3";
    const osbKey = "38caad28030506a21923e985ab268cc4";


    if (req.body.res && req.body.hash) {
        const content = JSON.parse(base64.decode(req.body.res)) // 0..TL, 1..USD, 2...EUR
        const email = content.email
        const productId = content.productid
        const orderId = content.orderid
        const user = await User.findOne({ email: email })
        if (!user) {
            res.send("Your email is not registered. Please send ticket to us with this order numer : " + content.orderid + " email:" + content.email + " product id : " + productId)
            return "";
        }
        const getProduct = await Prices.findOne({ shopierId: productId })
        if (!getProduct) {
            res.send("Product is not found. Please send ticket to us with this order numer : " + content.orderid + " email:" + content.email + " product id : " + productId)
            return "";
        }

        const newDate = new Date();
        const subscriptionEndDate = newDate.setMonth(newDate.getMonth() + getProduct.month)
        await user.updateOne({ subscription: true, subscriptionEndDate: subscriptionEndDate, priceId: getProduct._id })
        res.status(200).send(`
        Payment is successful. Please restart the app ! /n
        Ödeme başarılı. Lütfen Uygulamayı Yeniden Başlatın ! /n
        Оплата прошла успешно. Пожалуйста, перезапустите приложение!
        پرداخت موفقیت آمیز است. لطفاً برنامه را مجدداً راه اندازی کنید!`)





    }




}


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

module.exports = { getScreenShotRemains, takeScreenShot, registerUser, logOut, login, getVideo, getAllVideos, getCategory, getAllCategories, getAllVideoParts, getVideoPart, refreshToken, changeUserProfile, isUserSubscribed, changePassword, sendMail, forgetPassword, watchedInfo, getWatchedInfo, paymentForm, paymentCallBack, getListCombo, getSuggestedVideos };
