
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { getSettings } = require('../../Controllers/AdminController');

route.get('/', async (req, res) => {
    getSettings(req, res);
});

module.exports = route;