const { param } = require('../routes/registeruser');
var validator = require('validator');
const errorHandler = require('./errorhandler');
const { isAdmin, checkLogin, checkMissingParams } = require('./general');
const bcrypt = require('bcryptjs');
const config = require('../config.json');
var jwt = require('jsonwebtoken');
const { request } = require('express');
const Category = require("../schemas/category");
const Video = require('../schemas/videos');
const VideoPart = require('../schemas/videoparts');
const Admins = require('../schemas/admins');
const { findById } = require('../schemas/user');
const adminLogin = async (req, res) => {


    if (await checkLogin(req) == false) {

        const { email, password } = req.body;
        const userByEmail = await Admins.findOne({ email });
        if (userByEmail) {
            const comparePassword = await bcrypt.compare(password, userByEmail.hash)
            const token = jwt.sign({ email: email, type: 'admin' }, config.privateKey);
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

// Category İşlemleri





const addCategory = async (req, res) => {
    if (isAdmin(req)) { // Admin ise
        const params = ['categoryName', 'categoryNumber'];
        if (!checkMissingParams(params, req, res)) return;
        const { categoryName, categoryNumber } = req.body;
        const addCategory = new Category({
            categoryName,
            categoryNumber
        });
        await addCategory.save();
        res.status(200).send({ message: "category added" })

    }
}

const getCategory = async (req, res) => {
    try {
        if (isAdmin(req)) { // Admin ise
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
        if (isAdmin(req)) { // Admin ise
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

const updateCategory = async (req, res) => {
    try {
        if (isAdmin(req)) { // Admin ise
            const params = ['categoryId', 'categoryName', 'categoryNumber'];
            if (!checkMissingParams(params, req, res)) return;
            const { categoryId, categoryName, categoryNumber } = req.body;
            const category = await Category.findById(categoryId)
            await category.updateOne({
                categoryName,
                categoryNumber
            })



            res.status(200).send({ message: 'updated' })
        }
    }
    catch (e) {
        console.log(e)
        new errorHandler(res, 500, 0)
    }
}

const deleteCategory = async (req, res) => {
    try {
        if (isAdmin(req)) { // Admin ise
            const params = ['categoryId'];
            if (!checkMissingParams(params, req, res)) return;
            const { categoryId } = req.body;
            const category = await Category.findById(categoryId)
            await category.deleteOne()
            res.status(200).send({ message: 'deleted' })
        }
    }
    catch (e) {
        new errorHandler(res, 500, 0)
    }
}





// Category İşlemleri End







// Video İşlemleri


const addVideo = async (req, res) => {
    if (isAdmin(req)) { // Admin ise
        const params = ['categoryId', 'videoNumber', 'videoName', 'videoSource'];
        if (!checkMissingParams(params, req, res)) return;
        const { categoryId, videoNumber, videoName, videoSource } = req.body;
        const addVideo = new Video({
            videoName,
            categoryId,
            videoNumber,
            videoSource
        });
        await addVideo.save();
        res.status(200).send({ message: "video added" })

    }
}

const getVideo = async (req, res) => {
    try {
        if (isAdmin(req)) { // Admin ise
            const params = ['videoId'];
            if (!checkMissingParams(params, req, res)) return;
            const { videoId } = req.body;
            const video = await Video.findById(videoId)
            res.status(200).send({ video })
        }
    }
    catch (e) {
        new errorHandler(res, 500, 0)
    }
}

const getAllVideos = async (req, res) => {
    try {
        if (isAdmin(req)) { // Admin ise

            const params = ['categoryId'];
            const { categoryId } = req.body;

            const video = await Video.find({ categoryId: categoryId })
            video.sort((a, b) => (a.videoNumber > b.videoNumber) ? 1 : ((b.videoNumber > a.videoNumber) ? -1 : 0));
            res.status(200).send({ data: video })
        }
    }
    catch (e) {
        new errorHandler(res, 500, 0)
    }
}

const updateVideo = async (req, res) => {
    try {
        if (isAdmin(req)) { // Admin ise
            const params = ['videoId', 'categoryId', 'videoName', 'videoNumber', 'videoSource'];
            // if (!checkMissingParams(params, req, res)) return;
            const { videoId, categoryId, videoName, videoNumber, videoSource } = req.body;

            const video = await Video.findById(videoId)

            await video.updateOne({
                categoryId,
                videoNumber,
                videoName,
                videoSource

            })
            res.status(200).send({ message: 'updated' })
        }
    }
    catch (e) {
        console.log(e)
        // new errorHandler(res, 500, 0)
        res.status(500).send({ error: 'error' })
    }
}

const deleteVideo = async (req, res) => {
    try {
        if (isAdmin(req)) { // Admin ise
            const params = ['videoId'];
            // if (!checkMissingParams(params, req, res)) return;
            const { videoId } = req.body;
            const video = await Video.findById(videoId)
            await video.deleteOne()
            res.status(200).send({ message: 'deleted' })
        }
    }
    catch (e) {
        new errorHandler(res, 500, 0)
    }
}





// Video İşlemleri End





// Video Part İşlemleri


const addVideoPart = async (req, res) => {
    if (isAdmin(req)) { // Admin ise
        const params = ['videoId', 'minute', 'text'];
        // if (!checkMissingParams(params, req, res)) return;
        const { videoId, minute, text } = req.body;
        const addVideoPart = new VideoPart({
            videoId,
            minute,
            text
        });
        await addVideoPart.save();
        res.status(200).send({ message: "video part added" })

    }
}

const getVideoPart = async (req, res) => {
    try {
        if (isAdmin(req)) { // Admin ise
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
        if (isAdmin(req)) { // Admin ise
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

const updateVideoPart = async (req, res) => {
    try {
        if (isAdmin(req)) { // Admin ise
            const params = ['videoPartId', 'videoId', 'minute', 'text'];
            // if (!checkMissingParams(params, req, res)) return;
            const { videoPartId, minute, text } = req.body;
            const video = await VideoPart.findById(videoPartId)
            await video.updateOne({
                minute,
                text

            })
            res.status(200).send({ message: 'updated' })
        }
    }
    catch (e) {
        console.log(e)
        new errorHandler(res, 500, 0)
    }
}

const deleteVideoPart = async (req, res) => {
    try {
        if (isAdmin(req)) { // Admin ise
            const params = ['videoPartId'];
            // if (!checkMissingParams(params, req, res)) return;
            const { videoPartId } = req.body;
            const videoPart = await VideoPart.findById(videoPartId)
            await videoPart.deleteOne()
            res.status(200).send({ message: 'deleted' })
        }
    }
    catch (e) {
        new errorHandler(res, 500, 0)
    }
}

const addAdmin = async (req, res) => {
    if (isAdmin(req)) { // Admin ise
        const params = ['email', 'password', 'firstName', 'lastName'];
        // if (!checkMissingParams(params, req, res)) return;
        const { email, password, firstName, lastName } = req.body;
        const addAdmin = new Admins({
            email,
            hash: bcrypt.hashSync(password, 12),
            firstName,
            lastName
        });
        await addAdmin.save();
        res.status(200).send({ message: "video part added" })

    }
}

const getAllAdmins = async (req, res) => {
    try {
        if (isAdmin(req)) { // Admin ise
            // No need any parameters
            const admin = await Admins.find()

            // category.sort((a, b) => (a.categoryNumber > b.categoryNumber) ? 1 : ((b.categoryNumber > a.categoryNumber) ? -1 : 0));
            res.status(200).send({ data: admin })
        }
    }
    catch (e) {
        new errorHandler(res, 500, 0)
    }
}

const updateAdmin = async (req, res) => {
    if (isAdmin(req)) { // Admin ise

        // if (!checkMissingParams(params, req, res)) return;
        const { adminId, email, firstName, lastName } = req.body;
        console.log({ adminId, email, firstName, lastName })
        const addAdmin = Admins.findById(adminId)
        console.log()
        await addAdmin.updateOne({
            email,
            firstName,
            lastName
        });
        res.status(200).send({ message: "video part added" })

    }
}

const deleteAdmin = async (req, res) => {
    try {
        if (isAdmin(req)) { // Admin ise

            const { adminId } = req.body;
            const admin = await Admins.findById(adminId)
            await admin.deleteOne()
            res.status(200).send({ message: 'deleted' })
        }
    }
    catch (e) {
        new errorHandler(res, 500, 0)
    }
}



// Video Part İşlemleri End
module.exports = { adminLogin, addCategory, getCategory, getAllCategories, updateCategory, deleteCategory, addVideo, getVideo, getAllVideos, updateVideo, deleteVideo, addVideoPart, getVideoPart, getAllVideoParts, updateVideoPart, deleteVideoPart, addAdmin, getAllAdmins, updateAdmin, deleteAdmin }