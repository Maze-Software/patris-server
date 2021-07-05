
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { termsAndCondition } = require('../controllers/usercontroller');

route.get('/', async (req, res) => {
    termsAndCondition(req, res);
});

module.exports = route;