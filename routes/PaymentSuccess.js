
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { paymentSuccess } = require('../Controllers/UserController');

route.get('/', async (req, res) => {
    paymentSuccess(req, res);
});

module.exports = route;