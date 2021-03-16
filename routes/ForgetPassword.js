
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { forgetPassword } = require('../Controllers/UserController');

route.post('/', async (req, res) => {
    forgetPassword(req, res);
});

module.exports = route;