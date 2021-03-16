const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { takeScreenShot, getScreenShotRemains } = require('../controllers/UserController');

route.post('/', async (req, res) => {
    await takeScreenShot(req, res);
});

route.get('/', async (req, res) => {
    await getScreenShotRemains(req, res);
});


module.exports = route;