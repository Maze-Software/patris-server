
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { updateAdmin } = require('../../controllers/adminController');

route.post('/', async (req, res) => {
    updateAdmin(req, res);
});

module.exports = route;