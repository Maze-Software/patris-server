
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { getAllUser } = require('../../Controllers/AdminController');

route.post('/', async (req, res) => {
    getAllUser(req, res);
});

module.exports = route;