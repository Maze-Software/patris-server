
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { deletePrice } = require('../controllers/AdminController');

route.post('/', async (req, res) => {
    deletePrice(req, res);
});

module.exports = route;