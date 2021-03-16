
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { getAllVideoParts } = require('../../controllers/AdminController');

route.post('/', async (req, res) => {
    getAllVideoParts(req, res);
});

module.exports = route;