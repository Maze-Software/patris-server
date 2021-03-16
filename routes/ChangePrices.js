
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { changePrices } = require('../controllers/AdminController');

route.post('/', async (req, res) => {
    changePrices(req, res);
});

module.exports = route;