
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { addVideo } = require('../../controllers/adminController');

route.post('/', async (req, res) => {
    addVideo(req, res);
});

module.exports = route;