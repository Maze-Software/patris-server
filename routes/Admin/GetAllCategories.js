
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { getAllCategories } = require('../../controllers/admincontroller');

route.get('/', async (req, res) => {
    getAllCategories(req, res);
});

module.exports = route;