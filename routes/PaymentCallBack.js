
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { paymentCallBack } = require('../Controllers/UserController');

route.get('/', async (req, res) => {
    paymentCallBack(req, res);
});

module.exports = route;