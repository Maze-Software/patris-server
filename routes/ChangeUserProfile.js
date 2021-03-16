
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { changeUserProfile } = require('../Controllers/UserController');

route.post('/', async (req, res) => {
    changeUserProfile(req, res);
});

module.exports = route;