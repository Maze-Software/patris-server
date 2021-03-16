
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { changePassword } = require('../Controllers/UserController');

route.post('/', async (req, res) => {
    changePassword(req, res);
});

module.exports = route;