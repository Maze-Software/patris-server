
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { getVideo } = require('../../controllers/AdminController');

route.post('/', async (req, res) => {
    getVideo(req, res);
});

module.exports = route;