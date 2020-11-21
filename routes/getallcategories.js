
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { getAllCategories } = require('../controllers/usercontroller');

route.get('/', async (req, res) => {
    getAllCategories(req, res);
});

module.exports = route;