var mongoose = require('mongoose');
const config = require('./config/dev');

const DB_URL = config.database;
mongoose.Promise=require('bluebird');
mongoose.connect(DB_URL, { useMongoClient: true });
const db = mongoose.connection;

// const User = require('../models/user.js');

db.on('error', function (err) {
    db.close();
    console.log('Mongoose connection error: ' + err);
});

db.once('open', function () {
    console.log('Mongoose connecting to ' + DB_URL);
});

db.on('connected', function () {
    console.log('Mongoose connected to ' + DB_URL);
});


db.on('disconnected', function () {
    db.close()
    console.log('Mongoose connection disconnected');
});

module.exports = mongoose;