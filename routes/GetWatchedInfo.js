const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { getWatchedInfo } = require('../controllers/UserController');

route.get('/', async (req, res) => {
    getWatchedInfo(req, res);
});

module.exports = route;