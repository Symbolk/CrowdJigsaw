'use strict'

var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
var UserModel = mongoose.model('User');

var NAME = "Symbolk";//req.session.name

function LoginFirst(req, res, next) {
    if (!req.session.user) {
        req.session.error = 'Please Login First!';
        return res.redirect('/login');
        //return res.redirect('back');//返回之前的页面
    }
    next();
}

/* GET users listing. */
router.get('/', function (req, res, next) {
    UserModel.find({}, function (err, docs) {
        res.send(JSON.stringify(docs));
    });
});

/**
 * Save a record by one user when he gets his puzzle done
 */
router.post('/saveRecord', function (req, res, next) {
    let TIME = getNowFormatDate();
    let contri = 0;// to be calculated
    let operation = {
        $set: {
            end_time: TIME,
            steps: req.body.steps,
            time: req.body.time,
            contribution: contri
        }
    };
    UserModel.findOneAndUpdate({ username: req.session.user.username }, operation, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            res.send({ msg: "Your record has been saved." });
        }
    });
});

module.exports = router;
