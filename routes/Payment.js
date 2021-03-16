
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { paymentForm } = require('../Controllers/UserController');

route.get('/', async (req, res) => {
    paymentForm(req, res);
});

module.exports = route;