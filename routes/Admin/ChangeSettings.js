
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { changeSettings } = require('../../Controllers/AdminController');

route.post('/', async (req, res) => {
    changeSettings(req, res);
});

module.exports = route;