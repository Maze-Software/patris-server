const { param } = require('../routes/registeruser');
const User = require('../schemas/user');
const Admins = require('../schemas/admins');
var validator = require('validator');
const errorHandler = require('./errorhandler');
const { checkMissingParams, checkLogin } = require('./general');
const bcrypt = require('bcryptjs');
const config = require('../config.json');
var jwt = require('jsonwebtoken');
const { request } = require('express');
const Category = require("../schemas/category");
const Video = require('../schemas/videos');
const VideoPart = require('../schemas/videoparts');

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

const createJWT = (email) => {
    var JWT = jwt.sign({ email: email, type: 'user' }, config.privateKey);
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
            'grade'
        ];

        if (!checkMissingParams(params, req, res)) return;

        let { firstName, lastName, email, password, city, country, university, grade } = req.body;
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
                grade
            });



            await newUser.save(); // Insert to database
            const token = createJWT(email) // Create token
            res.cookie('token', token); // set token to the cookie
            res.status(200).send({ message: "User registered successfully", token: token, user: newUser }) // send response;




        }


    }
    else {
        res.status(500).send({ message: "You are already logged in" });
    }







};

const logOut = (req, res) => {
    res.clearCookie('token');
    res.status(202).send({ message: 'Log Outed Successfully' })
};

const login = async (req, res) => {


    if (await checkLogin(req) == false) {
        const { email, password } = req.body;
        const userByEmail = await User.findOne({ email });
        if (userByEmail) {
            const comparePassword = await bcrypt.compare(password, userByEmail.hash)
            const token = jwt.sign({ email: email }, config.privateKey);
            if (comparePassword) {
                res.cookie('token', token); // set token to the cookie
                res.status(200).send({ token: token, user: userByEmail })
            }
            else {
                new errorHandler(res, 500, 13)
            }
        }
        else {
            new errorHandler(res, 500, 13)
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
            const video = await Video.find({ categoryId: categoryId })
            video.sort((a, b) => (a.videoNumber > b.videoNumber) ? 1 : ((b.videoNumber > a.videoNumber) ? -1 : 0));
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
            const category = await Category.find()

            category.sort((a, b) => (a.categoryNumber > b.categoryNumber) ? 1 : ((b.categoryNumber > a.categoryNumber) ? -1 : 0));
            res.status(200).send({ data: category })
        }
    }
    catch (e) {
        new errorHandler(res, 500, 0)
    }
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


module.exports = { registerUser, logOut, login, getVideo, getAllVideos, getCategory, getAllCategories, getAllVideoParts, getVideoPart };
