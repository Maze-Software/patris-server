
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { panelSelectVideos } = require('../../controllers/AdminController');

route.post('/', async (req, res) => {
    panelSelectVideos(req, res);
});

module.exports = route;