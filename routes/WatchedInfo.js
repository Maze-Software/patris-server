
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { watchedInfo } = require('../controllers/UserController');

route.post('/', async (req, res) => {
    watchedInfo(req, res);
});

module.exports = route;