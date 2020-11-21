
const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { addVideoPart } = require('../../controllers/admincontroller');

route.post('/', async (req, res) => {
    addVideoPart(req, res);
});

module.exports = route;