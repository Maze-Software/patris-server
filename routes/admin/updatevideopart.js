
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { updateVideoPart } = require('../../controllers/AdminController');

route.post('/', async (req, res) => {
    updateVideoPart(req, res);
});

module.exports = route;