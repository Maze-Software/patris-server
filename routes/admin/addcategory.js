
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { addCategory } = require('../../controllers/admincontroller');

route.post('/', async (req, res) => {
    addCategory(req, res);
});

module.exports = route;