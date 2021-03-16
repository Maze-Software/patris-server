
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { refreshToken } = require('../controllers/UserController');

route.get('/', async (req, res) => {
    refreshToken(req, res);
});

module.exports = route;