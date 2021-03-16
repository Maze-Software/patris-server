
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { getPrices } = require('../controllers/AdminController');

route.get('/', async (req, res) => {
    getPrices(req, res);
});

module.exports = route;