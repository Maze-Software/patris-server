
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { updateCategory } = require('../../controllers/adminController');

route.post('/', async (req, res) => {
    updateCategory(req, res);
});

module.exports = route;