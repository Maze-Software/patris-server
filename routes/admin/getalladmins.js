
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { getAllAdmins } = require('../../controllers/AdminController');

route.get('/', async (req, res) => {
    getAllAdmins(req, res);
});

module.exports = route;