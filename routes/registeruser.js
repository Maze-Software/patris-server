const express = require('express');
const mongoose = require('mongoose');
const route = express.Router();
const { registerUser } = require('../controllers/UserController');

route.post('/', async (req, res) => {
    // try {
    await registerUser(req, res);
    // }
    // catch (e) {
    //     res.status(500)
    //     res.send(e)
    // }

});


module.exports = route;