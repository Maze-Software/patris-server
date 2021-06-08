const { param } = require("../routes/RegisterUser");
var validator = require("validator");
const errorHandler = require("./ErrorHandler");
const { isAdmin, checkLogin, checkMissingParams } = require("./General");
const bcrypt = require("bcryptjs");
const config = require("../config.json");
var jwt = require("jsonwebtoken");
const { request } = require("express");
const Category = require("../Schemas/Category");
const Video = require("../Schemas/Videos");
const VideoPart = require("../Schemas/VideoParts");
const Admins = require("../Schemas/Admins");
const { findById } = require("../Schemas/User");
const Axios = require("axios");
const User = require("../Schemas/User");
const Settings = require("../Schemas/Settings");
const Prices = require("../Schemas/Prices");
const { set } = require("mongoose");
const WatchedInfo = require("../Schemas/WatchedInfo");

const adminLogin = async (req, res) => {
  if ((await checkLogin(req)) == false) {
    const { email, password } = req.body;
    const userByEmail = await Admins.findOne({ email });
    if (userByEmail) {
      const comparePassword = await bcrypt.compare(password, userByEmail.hash);
      const token = jwt.sign(
        { email: email, type: "admin" },
        config.privateKey
      );
      if (comparePassword) {
        res.cookie("token", token); // set token to the cookie
        res.status(200).send({ token: token, user: userByEmail });
      } else {
        new errorHandler(res, 500, 13);
      }
    } else {
      new errorHandler(res, 500, 13);
    }
  } else {
    const user = await checkLogin(req);
    res.status(200).send({ token: req.cookies.token, user: user });
  }
};

// Category İşlemleri

const addCategory = async (req, res) => {
  if (isAdmin(req)) {
    // Admin ise
    const params = ["categoryName", "categoryNumber"];
    if (!checkMissingParams(params, req, res)) return;
    let { categoryName, categoryNumber, lang } = req.body;
    if (!lang) lang = "en";
    const addCategory = new Category({
      categoryName,
      categoryNumber,
      lang,
    });
    await addCategory.save();
    res.status(200).send({ message: "category added" });
  }
};

const getCategory = async (req, res) => {
  try {
    if (isAdmin(req)) {
      // Admin ise
      const params = ["categoryId"];
      if (!checkMissingParams(params, req, res)) return;
      const { categoryId } = req.body;
      const category = await Category.findById(categoryId);
      res.status(200).send({ category });
    }
  } catch (e) {
    new errorHandler(res, 500, 0);
  }
};

const getAllCategories = async (req, res) => {
  try {
    if (isAdmin(req)) {
      // Admin ise
      let { lang } = req.body;

      let category;
      if (!lang || lang.length < 1) category = await Category.find();
      else category = await Category.find({ lang });
      category.sort((a, b) =>
        a.categoryNumber > b.categoryNumber
          ? 1
          : b.categoryNumber > a.categoryNumber
            ? -1
            : 0
      );

      res.status(200).send({ data: category });
    }
  } catch (e) {
    new errorHandler(res, 500, 0);
  }
};

const updateCategory = async (req, res) => {
  try {
    if (isAdmin(req)) {
      // Admin ise
      const params = ["categoryId", "categoryName", "categoryNumber"];
      if (!checkMissingParams(params, req, res)) return;
      const { categoryId, categoryName, categoryNumber } = req.body;
      const category = await Category.findById(categoryId);
      await category.updateOne({
        categoryName,
        categoryNumber,
      });

      res.status(200).send({ message: "updated" });
    }
  } catch (e) {
    console.log(e);
    new errorHandler(res, 500, 0);
  }
};

const deleteCategory = async (req, res) => {
  try {
    if (isAdmin(req)) {
      // Admin ise
      const params = ["categoryId"];
      if (!checkMissingParams(params, req, res)) return;
      const { categoryId } = req.body;
      const category = await Category.findById(categoryId);
      await category.deleteOne();
      res.status(200).send({ message: "deleted" });
    }
  } catch (e) {
    new errorHandler(res, 500, 0);
  }
};

// Category İşlemleri End

// Video İşlemleri

const addVideo = async (req, res) => {
  if (isAdmin(req)) {
    // Admin ise
    const params = ["categoryId", "videoNumber", "videoName", "videoSource"];
    if (!checkMissingParams(params, req, res)) return;
    const {
      categoryId,
      videoNumber,
      videoName,
      videoSource,
      freeTrial,
    } = req.body;

    let videoId = videoSource.split("/");
    videoId = videoId[videoId.length - 1];

    Axios.get("https://player.vimeo.com/video/" + videoId)
      .then(async (response) => {
        let startIndex = response.data.search('"duration":');
        let lastIndex = response.data.search('"thumbs"');
        lastIndex = lastIndex - startIndex;
        let duration = response.data.substr(startIndex + 11, lastIndex - 12);

        let startIndex2 = response.data.search('"thumbs":');
        let lastIndex2 = response.data.search('"owner":');
        lastIndex2 = lastIndex2 - startIndex2;
        let thumb = response.data.substr(startIndex2 + 9, lastIndex2 - 10);

        thumb = JSON.parse(thumb);

        const addVideo = new Video({
          videoName,
          categoryId,
          videoNumber,
          videoSource,
          duration,
          thumb,
          freeTrial,
        });

        await addVideo.save();
        res.status(200).send({ message: "video added" });
      })
      .catch((error) => {
        new errorHandler(res, 500, 0);
      });
  }
};

const getVideo = async (req, res) => {
  try {
    if (isAdmin(req)) {
      // Admin ise
      const params = ["videoId"];
      if (!checkMissingParams(params, req, res)) return;
      const { videoId } = req.body;
      const video = await Video.findById(videoId);
      res.status(200).send({ video });
    }
  } catch (e) {
    new errorHandler(res, 500, 0);
  }
};

const getAllVideos = async (req, res) => {
  try {
    if (isAdmin(req)) {
      // Admin ise

      const params = ["categoryId"];
      const { categoryId } = req.body;

      const video = await Video.find({ categoryId: categoryId });
      video.sort((a, b) =>
        a.videoNumber > b.videoNumber
          ? 1
          : b.videoNumber > a.videoNumber
            ? -1
            : 0
      );
      res.status(200).send({ data: video });
    }
  } catch (e) {
    new errorHandler(res, 500, 0);
  }
};

const updateVideo = async (req, res) => {
  try {
    if (isAdmin(req)) {
      // Admin ise
      const params = [
        "videoId",
        "categoryId",
        "videoName",
        "videoNumber",
        "videoSource",
        "freeTrial",
      ];
      // if (!checkMissingParams(params, req, res)) return;
      const {
        videoId,
        categoryId,
        videoName,
        videoNumber,
        videoSource,
        freeTrial,
      } = req.body;

      const video = await Video.findById(videoId);

      await video.updateOne({
        categoryId,
        videoNumber,
        videoName,
        videoSource,
        freeTrial,
      });
      res.status(200).send({ message: "updated" });
    }
  } catch (e) {
    console.log(e);
    // new errorHandler(res, 500, 0)
    res.status(500).send({ error: "error" });
  }
};

const deleteVideo = async (req, res) => {
  try {
    if (isAdmin(req)) {
      // Admin ise
      // const params = ["videoId"];
      // if (!checkMissingParams(params, req, res)) return;
      const { videoId } = req.body;
      const video = await Video.findById(videoId);
      await video.deleteOne();

      await VideoPart.deleteMany({ videoId: videoId }); // video partları da siliyoruz

      await WatchedInfo.deleteMany({ videoId: videoId });

      await Prices.updateMany({}, { $pull: { videos: videoId } })




      res.status(200).send({ message: "deleted" });
    }
  } catch (e) {
    new errorHandler(res, 500, 0);
  }
};

// Video İşlemleri End

// Video Part İşlemleri

const addVideoPart = async (req, res) => {
  if (isAdmin(req)) {
    // Admin ise
    const params = ["videoId", "minute", "text"];
    // if (!checkMissingParams(params, req, res)) return;
    const { videoId, minute, text } = req.body;
    const addVideoPart = new VideoPart({
      videoId,
      minute,
      text,
    });
    await addVideoPart.save();
    res.status(200).send({ message: "video part added" });
  }
};

const getVideoPart = async (req, res) => {
  try {
    if (isAdmin(req)) {
      // Admin ise
      const params = ["videoPartId"];
      if (!checkMissingParams(params, req, res)) return;
      const { videoPartId } = req.body;
      const videoPart = await VideoPart.findById(videoPartId);
      res.status(200).send({ videoPart });
    }
  } catch (e) {
    new errorHandler(res, 500, 0);
  }
};

const getAllVideoParts = async (req, res) => {
  try {
    if (isAdmin(req)) {
      // Admin ise
      // No need any parameters
      const { videoId } = req.body;
      const videoPart = await VideoPart.find({ videoId: videoId });
      res.status(200).send({ data: videoPart });
    }
  } catch (e) {
    new errorHandler(res, 500, 0);
  }
};

const updateVideoPart = async (req, res) => {
  try {
    if (isAdmin(req)) {
      // Admin ise
      const params = ["videoPartId", "videoId", "minute", "text"];
      // if (!checkMissingParams(params, req, res)) return;
      const { videoPartId, minute, text } = req.body;
      const video = await VideoPart.findById(videoPartId);
      await video.updateOne({
        minute,
        text,
      });
      res.status(200).send({ message: "updated" });
    }
  } catch (e) {
    console.log(e);
    new errorHandler(res, 500, 0);
  }
};

const deleteVideoPart = async (req, res) => {
  try {
    if (isAdmin(req)) {
      // Admin ise
      const params = ["videoPartId"];
      // if (!checkMissingParams(params, req, res)) return;
      const { videoPartId } = req.body;
      const videoPart = await VideoPart.findById(videoPartId);
      await videoPart.deleteOne();
      res.status(200).send({ message: "deleted" });
    }
  } catch (e) {
    new errorHandler(res, 500, 0);
  }
};

const addAdmin = async (req, res) => {
  if (isAdmin(req)) {
    // Admin ise
    const params = ["email", "password", "firstName", "lastName"];
    // if (!checkMissingParams(params, req, res)) return;
    const { email, password, firstName, lastName } = req.body;
    const addAdmin = new Admins({
      email,
      hash: bcrypt.hashSync(password, 12),
      firstName,
      lastName,
    });
    await addAdmin.save();
    res.status(200).send({ message: "video part added" });
  }
};

const getAllAdmins = async (req, res) => {
  try {
    if (isAdmin(req)) {
      // Admin ise
      // No need any parameters
      const admin = await Admins.find();

      // category.sort((a, b) => (a.categoryNumber > b.categoryNumber) ? 1 : ((b.categoryNumber > a.categoryNumber) ? -1 : 0));
      res.status(200).send({ data: admin });
    }
  } catch (e) {
    new errorHandler(res, 500, 0);
  }
};

const updateAdmin = async (req, res) => {
  if (isAdmin(req)) {
    // Admin ise

    // if (!checkMissingParams(params, req, res)) return;
    const { adminId, email, firstName, lastName } = req.body;
    console.log({ adminId, email, firstName, lastName });
    const addAdmin = Admins.findById(adminId);
    console.log();
    await addAdmin.updateOne({
      email,
      firstName,
      lastName,
    });
    res.status(200).send({ message: "video part added" });
  }
};

const deleteAdmin = async (req, res) => {
  try {
    if (isAdmin(req)) {
      // Admin ise

      const { adminId } = req.body;
      const admin = await Admins.findById(adminId);
      await admin.deleteOne();
      res.status(200).send({ message: "deleted" });
    }
  } catch (e) {
    new errorHandler(res, 500, 0);
  }
};

const removeUser = async (req, res) => {
  try {
    if (isAdmin(req)) {
      const { id } = req.body;
      const user = await User.findByIdAndDelete(id);

      res.status(200).send({ message: "deleted" });
    }
  } catch (e) {
    new errorHandler(res, 500, 0);
  }
};

const getAllUser = async (req, res) => {
  try {
    if (isAdmin(req)) {
      // Admin ise

      const users = await User.find();
      res.status(200).send({ users: users });
    }
  } catch (e) {
    new errorHandler(res, 500, 0);
  }
};

const getUserCount = async (req, res) => {
  try {
    if (isAdmin(req)) {
      // Admin ise

      const users = await User.countDocuments();
      res.status(200).send({ users: users });
    }
  } catch (e) {
    new errorHandler(res, 500, 0);
  }
};

const getSettings = async (req, res) => {
  try {
    const settings = await Settings.find().limit(1);
    res.status(200).send({ settings: settings[0] });
  } catch (e) {
    new errorHandler(res, 500, 0);
  }
};

const changeSettings = async (req, res) => {
  try {
    if (isAdmin(req)) {
      // Admin ise

      const {
        mainColor,
        secondColor,
        shareButton,
        profileColor,
        faqColor,
        savedColor,
        contact,
        navigationColor,
        pageBackgroundColor,
        share
      } = req.body;

      const settingsCount = await Settings.estimatedDocumentCount();
      if (settingsCount > 0) {
        const settings = await Settings.updateOne(
          {},
          {
            mainColor,
            secondColor,
            shareButton,
            profileColor,
            faqColor,
            savedColor,
            contact,
            navigationColor,
            pageBackgroundColor,
            share
          }
        );
        res
          .status(200)
          .send({ message: "updated", settingsCount: settingsCount });
      } else {
        const newSettings = new Settings({
          mainColor,
          secondColor,
          shareButton,
          profileColor,
          faqColor,
          savedColor,
          contact,
          navigationColor,
          pageBackgroundColor,
          share
        });
        newSettings.save();
        res.status(200).send({ message: "created" });
      }
    }
  } catch (e) {
    new errorHandler(res, 500, 0);
  }
};

const getPrices = async (req, res) => {
  try {
    let { lang } = req.body;
    if (!lang) lang = "en";

    if (lang == "all") {
      const prices = await Prices.find().sort({ month: 1 });
      res.status(200).send({ prices: prices });
    } else {
      const prices = await Prices.find({ lang: lang }).sort({ month: 1 });
      res.status(200).send({ price: prices, appstoreReview: config.appstoreReview });
    }
  } catch (e) {
    // console.log(e)
    new errorHandler(res, 500, 0);
  }
};

const changePrices = async (req, res) => {
  try {
    if (isAdmin(req)) {
      // Admin ise
      const {
        lang,
        month,
        price,
        priceId,
        currency,
        priceText,
        shopierId,
        priceContent,
        videos
      } = req.body;
      const updatePrice = await Prices.findByIdAndUpdate(priceId, {
        lang: lang,
        month: month,
        price: price,
        shopierId: shopierId,
        currency: currency,
        priceText: priceText,
        priceContent: priceContent,
        videos: videos
      });
      res.status(200).send({ message: "updated" });
    }
  } catch (e) {
    new errorHandler(res, 500, 0);
  }
};

const deletePrice = async (req, res) => {
  try {
    if (isAdmin(req)) {
      // Admin ise
      const { priceId } = req.body;
      const deletePrice = await Prices.findByIdAndDelete(priceId);
      res.status(200).send({ message: "deleted" });
    }
  } catch (e) {
    new errorHandler(res, 500, 0);
  }
};

const addPrices = async (req, res) => {
  try {
    if (isAdmin(req)) {
      // Admin ise
      const {
        lang,
        month,
        price,
        currency,
        priceText,
        priceContent,
        shopierId,
        videos
      } = req.body;
      const createPrice = new Prices({
        lang,
        month,
        price,
        shopierId,
        currency,
        priceText,
        priceContent,
        videos
      });
      await createPrice.save();
      res.status(200).send({ message: "created" });
    }
  } catch (e) {
    new errorHandler(res, 500, 0);
  }
};


const panelSelectVideos = async (req, res) => {
  try {
    if (isAdmin(req)) {
      // Admin ise
      const { lang } = req.body;
      const categories = await Category.find({ lang: lang }).lean();

      for (let i = 0; i < categories.length; i++) {
        const category = categories[i];
        const videos = await Video.find({ categoryId: category._id }).lean();
        videos.forEach((e) => e.videoSource = ""); // güvenlik gerekçesi ile
        category.videos = videos;
      }




      res.status(200).send({ categories: categories });
    }
  } catch (e) {
    new errorHandler(res, 500, 0);
  }

}

// Video Part İşlemleri End
module.exports = {
  panelSelectVideos,
  adminLogin,
  addCategory,
  getCategory,
  getAllCategories,
  updateCategory,
  deleteCategory,
  addVideo,
  getVideo,
  getAllVideos,
  updateVideo,
  deleteVideo,
  addVideoPart,
  getVideoPart,
  getAllVideoParts,
  updateVideoPart,
  deleteVideoPart,
  addAdmin,
  getAllAdmins,
  updateAdmin,
  deleteAdmin,
  getAllUser,
  changeSettings,
  getSettings,
  getPrices,
  changePrices,
  addPrices,
  deletePrice,
  getUserCount,
  removeUser,
};
