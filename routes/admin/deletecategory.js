
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { deleteCategory } = require('../../controllers/AdminController');

route.post('/', async (req, res) => {
    deleteCategory(req, res);
});

module.exports = route;