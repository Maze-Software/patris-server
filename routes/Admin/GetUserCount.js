const express = require("express");
const mongoose = require("mongoose");
const route = express.Router();
const { getUserCount } = require("../../Controllers/AdminController");

route.get("/", async (req, res) => {
  getUserCount(req, res);
});

module.exports = route;
