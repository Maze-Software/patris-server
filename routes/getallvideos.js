
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { getAllVideos } = require('../controllers/UserController');

route.get('/', async (req, res) => {
    getAllVideos(req, res);
});

module.exports = route;