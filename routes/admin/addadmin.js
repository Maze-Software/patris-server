
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { addAdmin } = require('../../controllers/admincontroller');

route.post('/', async (req, res) => {
    addAdmin(req, res);
});

module.exports = route;