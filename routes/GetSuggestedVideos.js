
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { getSuggestedVideos } = require('../controllers/UserController');

route.get('/', async (req, res) => {
    getSuggestedVideos(req, res);
});

module.exports = route;