
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { getListCombo } = require('../controllers/UserController');

route.get('/', async (req, res) => {
    getListCombo(req, res);
});

module.exports = route;