
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { deleteCategory } = require('../../controllers/adminController');

route.post('/', async (req, res) => {
    deleteCategory(req, res);
});

module.exports = route;