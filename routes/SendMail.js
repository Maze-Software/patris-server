
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { sendMail } = require('../Controllers/UserController');

route.post('/', async (req, res) => {
    sendMail(req, res);
});

module.exports = route;