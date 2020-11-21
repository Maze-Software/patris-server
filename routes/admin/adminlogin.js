
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { adminLogin } = require('../../controllers/admincontroller');

route.post('/', async (req, res) => {
    adminLogin(req, res);
});

module.exports = route;