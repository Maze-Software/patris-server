
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { getCategory } = require('../../controllers/AdminController');

route.get('/', async (req, res) => {
    getCategory(req, res);
});

module.exports = route;