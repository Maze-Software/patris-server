
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { getVideo } = require('../Controllers/UserController');

route.get('/', async (req, res) => {
    getVideo(req, res);
});

module.exports = route;