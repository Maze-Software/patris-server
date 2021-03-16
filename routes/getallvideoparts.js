
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { getAllVideoParts } = require('../controllers/UserController');

route.get('/', async (req, res) => {
    getAllVideoParts(req, res);
});

module.exports = route;