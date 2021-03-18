const express = require("express");
const mongoose = require("mongoose");
const route = express.Router();
const { removeUser } = require("../../controllers/AdminController");

route.post("/", async (req, res) => {
  removeUser(req, res);
});

module.exports = route;
