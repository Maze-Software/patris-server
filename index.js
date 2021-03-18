const express = require("express");
// const Port = process.env.Port || 1337
const Port = 80;
const connectDB = require("./consts/DbConnection");
const app = express();
const config = require("./config.json");
var jwt = require("jsonwebtoken");
var cookieParser = require("cookie-parser");
var bodyParser = require("body-parser");
const server = require("http").Server(app);
app.use(cookieParser());
connectDB();
app.use(express.json({ extended: false }));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header(
    "Access-Control-Allow-Headers",
    "Origin, X-Requested-With, Content-Type, Accept"
  );
  next();
});
// ---------------------------------------- //
const path = require("path");
app.use(express.static(path.join(__dirname, "build")));
app.use((req, res, next) => {
  req.body = { ...req.body, ...req.query };
  if (req.body.token) {
    req.cookies.token = req.body.token;
  }
  next();
});

// -- ROUTES -- //
// USER
app.use("/api/registeruser", require("./routes/RegisterUser"));
app.use("/api/logout", require("./routes/LogOut"));
app.use("/api/refreshToken", require("./routes/RefreshToken"));
app.use("/api/login", require("./routes/Login"));
app.use("/api/user/getvideo", require("./routes/GetVideos"));
app.use("/api/user/getallvideos", require("./routes/GetAllVideos"));
app.use("/api/user/getcategory", require("./routes/GetCategory"));
app.use("/api/user/getallcategories", require("./routes/GetAllCategories"));
app.use("/api/user/getallvideoparts", require("./routes/GetAllVideoParts"));
app.use("/api/user/changeuserprofile", require("./routes/ChangeUserProfile"));
app.use("/api/user/isusersubscribed", require("./routes/isUserSubscribed"));
app.use("/api/user/changepassword", require("./routes/ChangePassword"));
app.use("/api/user/sendmail", require("./routes/SendMail"));
app.use("/api/user/forgetpassword", require("./routes/ForgetPassword"));
app.use("/api/user/watchedinfo", require("./routes/WatchedInfo"));
app.use("/api/user/getwatchedinfo", require("./routes/GetWatchedInfo"));
app.use("/api/user/payment", require("./routes/Payment"));
app.use("/api/user/paymentcallback", require("./routes/PaymentCallBack"));
app.use("/api/user/getlistcombo", require("./routes/GetListCombo"));
app.use("/api/user/getsuggestedvideos", require("./routes/GetSuggestedVideos"));
app.use("/api/user/getsettings", require("./routes/Admin/GetSettings"));
app.use("/api/screenshot", require("./routes/ScreenShot"));

// ADMIN ICIN
app.use("/api/adminlogin", require("./routes/Admin/AdminLogin"));
app.use("/api/addcategory", require("./routes/Admin/AddCategory"));
app.use("/api/getcategory", require("./routes/Admin/GetCategory"));
app.use("/api/getallcategories", require("./routes/Admin/GetAllCategories"));
app.use("/api/updatecategory", require("./routes/Admin/UpdateCategory"));
app.use("/api/deletecategory", require("./routes/Admin/DeleteCategory"));
app.use("/api/addvideo", require("./routes/Admin/AddVideo"));
app.use("/api/getvideo", require("./routes/Admin/GetVideo"));
app.use("/api/getallvideos", require("./routes/Admin/GetAllVideos"));
app.use("/api/getallvideoparts", require("./routes/Admin/GetAllVideoParts"));
app.use("/api/updatevideo", require("./routes/Admin/UpdateVideo"));
app.use("/api/deletevideo", require("./routes/Admin/DeleteVideo"));
app.use("/api/addadmin", require("./routes/Admin/AddAdmin"));
app.use("/api/updatevideopart", require("./routes/Admin/UpdateVideoPart"));
app.use("/api/addvideopart", require("./routes/Admin/AddVideoPart"));
app.use("/api/deletevideopart", require("./routes/Admin/DeleteVideoPart"));
app.use("/api/getalladmins", require("./routes/Admin/GetAllAdmins"));
app.use("/api/updateadmin", require("./routes/Admin/UpdateAdmin"));
app.use("/api/deleteadmin", require("./routes/Admin/DeleteAdmin"));
app.use("/api/getalluser", require("./routes/Admin/GetAllUser"));
app.use("/api/getsettings", require("./routes/Admin/GetSettings"));
app.use("/api/changesettings", require("./routes/Admin/ChangeSettings"));
app.use("/api/getprices", require("./routes/GetPrices"));
app.use("/api/changeprices", require("./routes/ChangePrices"));
app.use("/api/addprice", require("./routes/AddPrice"));
app.use("/api/deleteprice", require("./routes/DeletePrice"));
app.use("/api/getusercount", require("./routes/Admin/getUserCount"));
// -- ROUTES END -- //

app.get("*", function (req, res) {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});

server.listen(Port, () => console.log("Server started"));
