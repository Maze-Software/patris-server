
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { addPrices } = require('../controllers/AdminController');

route.post('/', async (req, res) => {
    addPrices(req, res);
});

module.exports = route;