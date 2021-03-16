
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { adminLogin } = require('../../Controllers/AdminController');

route.post('/', async (req, res) => {
    adminLogin(req, res);
});

module.exports = route;