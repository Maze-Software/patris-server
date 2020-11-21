const errorHandler = require('./errorhandler');
var jwt = require('jsonwebtoken');
const { use } = require('../routes/login');
const config = require('../config.json');
const User = require('../schemas/user');
const Admins = require('../schemas/admins');
const checkMissingParams = (array, req, res) => {
    try {
        array.forEach(key => {
            if (!req.body.hasOwnProperty(key)) {
                new errorHandler(res, 500, 1, { value: key })
                return false;
            }
        });

        return true;
    }
    catch (e) {
        // console.log(e)
    }
}

const checkLogin = async (req) => {

    try {
        const token = req.cookies.token;

        if (token) {
            var result = jwt.verify(token, config.privateKey);
            const user = await User.findOne({ userName: result.userName })

            if (user) {
                return user;
            }
            else {
                return false;
            }
        }
        else {
            return false;
        }
    }
    catch (e) {
        return false;
    }

}


const isAdmin = async (req) => {

    try {
        const token = req.cookies.token;

        if (token) {
            var result = jwt.verify(token, config.privateKey);
            const user = await Admins.findOne({ userName: result.userName })

            if (user && result.type == 'admin') {
                return true;
            }
            else {
                return false;
            }
        }
        else {
            return false;
        }
    }
    catch (e) {
        return false;
    }

}


module.exports = { checkMissingParams, checkLogin, isAdmin };
