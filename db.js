const mongoose = require('mongoose');
const DB_URL = 'mongodb://localhost:27017/CrowdJigsaw';
mongoose.connect(DB_URL, { useMongoClient: true });
const db = mongoose.connection;

// const User = require('../models/user.js');

/**
* 连接异常
*/
db.on('error', function (err) {
    console.log('Mongoose connection error: ' + err);
});

/**
* 连接成功
*/
db.on('connected', function () {
    console.log('Mongoose connected to ' + DB_URL);
});

db.once('open', function () {
    // create the user schema
    // var UserSchema = new mongoose.Schema({
    //     username: { type: String, required: true, unique: true, index: true },
    //     email: { type: String, default: '' },
    //     avatar: { type: String, default: 'images/profile_placeholder.png' },
    //     password: { type: String },
    //     joindate: { type: Date, default: Date.now },
    //     points: { type: Number },
    //     rank: { type: Number },
    // },
    //     // When no collection argument is passed, Mongoose pluralizes the name.
    //     { collection: 'users' }
    // );

    // // UserSchema.set('collection', 'users');
    // let User = mongoose.model('User', UserSchema, 'users');

});
var GraphSchema = new mongoose.Schema({
    from: { type: Number },
    to: { type: Number },
    // supNum: { type: Number },
    // oppNum: { type: Number },
    // supporters: [
    //     {
    //         username: { type: String },
    //         direction: { type: String },
    //     }
    // ],
    // opposers: [
    //     {
    //         username: { type: String },
    //         direction: { type: String },
    //     }
    // ]
}, { collection: 'graph' });
var Link = mongoose.model('Link', GraphSchema, 'graph');

/**
* 连接断开
*/
db.on('disconnected', function () {
    console.log('Mongoose connection disconnected');
});

module.exports = mongoose;