
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { deleteAdmin } = require('../../controllers/admincontroller');

route.post('/', async (req, res) => {
    deleteAdmin(req, res);
});

module.exports = route;