
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { deleteVideoPart } = require('../../controllers/adminController');

route.post('/', async (req, res) => {
    deleteVideoPart(req, res);
});

module.exports = route;