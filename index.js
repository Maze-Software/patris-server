const express = require('express');
const Port = process.env.Port || 1337;
const connectDB = require('./consts/dbconnection');
const app = express();
const config = require('./config.json');
var jwt = require('jsonwebtoken');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
const server = require('http').Server(app);
app.use(cookieParser());
connectDB();
app.use(express.json({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }))
app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});
// ---------------------------------------- //


app.use((req, res, next) => {

    req.body = { ...req.body, ...req.query }
    if (req.body.token) {
        req.cookies.token = req.body.token;
    }
    next();
})


// -- ROUTES -- //
// USER
app.use('/api/registeruser', require('./routes/registeruser'));
app.use('/api/logout', require('./routes/logout'));
app.use('/api/login', require('./routes/login'));
app.use('/api/user/getvideo', require('./routes/getvideos'));
app.use('/api/user/getallvideos', require('./routes/getallvideos'));
app.use('/api/user/getcategory', require('./routes/getcategory'));
app.use('/api/user/getallcategories', require('./routes/getallcategories'));
app.use('/api/user/getallvideoparts', require('./routes/getallvideoparts'));

// ADMIN ICIN
app.use('/api/adminlogin', require('./routes/admin/adminlogin'));
app.use('/api/addcategory', require('./routes/admin/addcategory'));
app.use('/api/getcategory', require('./routes/admin/getcategory'));
app.use('/api/getallcategories', require('./routes/admin/getallcategories'));
app.use('/api/updatecategory', require('./routes/admin/updatecategory'));
app.use('/api/deletecategory', require('./routes/admin/deletecategory'));
app.use('/api/addvideo', require('./routes/admin/addvideo'));
app.use('/api/getvideo', require('./routes/admin/getvideo'));
app.use('/api/getallvideos', require('./routes/admin/getallvideos'));
app.use('/api/getallvideoparts', require('./routes/admin/getallvideoparts'));
app.use('/api/updatevideo', require('./routes/admin/updatevideo'));
app.use('/api/deletevideo', require('./routes/admin/deletevideo'));
app.use('/api/addadmin', require('./routes/admin/addadmin'));
app.use('/api/updatevideopart', require('./routes/admin/updatevideopart'));
app.use('/api/addvideopart', require('./routes/admin/addvideopart'));
app.use('/api/deletevideopart', require('./routes/admin/deletevideopart'));
app.use('/api/getalladmins', require('./routes/admin/getalladmins'));
app.use('/api/updateadmin', require('./routes/admin/updateadmin'));
app.use('/api/deleteadmin', require('./routes/admin/deleteadmin'));

// -- ROUTES END -- //








server.listen(Port, () => console.log('Server started'));