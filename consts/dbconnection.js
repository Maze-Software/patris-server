const mongoose = require('mongoose');
const config = require('../config.json');

const connectDB = async () => {
    await mongoose.connect(config.DBuri, {
        useUnifiedTopology: true,
        useNewUrlParser: true
    });
    console.log('db connected..!');
};

module.exports = connectDB;