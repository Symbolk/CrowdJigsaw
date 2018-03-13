var mongoose = require('mongoose');
const config = require('./config/dev');

const DB_URL = config.database;
mongoose.Promise = require('bluebird');
/** 
 * Comment the auth/user/pass if your db requires no auth
*/
var options = {
    useMongoClient: true,
    //auth: { authdb: 'admin' },
    //user: config.user,
    //pass: config.pass
};
mongoose.connect(DB_URL, options);
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