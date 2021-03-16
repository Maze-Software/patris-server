
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { isUserSubscribed } = require('../Controllers/UserController');

route.get('/', async (req, res) => {
    isUserSubscribed(req, res);
});

module.exports = route;