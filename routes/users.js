'use strict'

var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
var UserModel = mongoose.model('User');


/* GET users listing. */
router.get('/', function(req, res, next) {
  UserModel.find({},function(err, docs){
    res.send(JSON.stringify(docs));
  })
});


module.exports = router;
