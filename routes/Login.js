
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { login } = require('../controllers/usercontroller');

route.post('/', async (req, res) => {
    login(req, res);
});

module.exports = route;