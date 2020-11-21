
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { deleteVideo } = require('../../controllers/adminController');

route.post('/', async (req, res) => {
    deleteVideo(req, res);
});

module.exports = route;