const mongoose = require('mongoose');
const config=require('./config/dev');

const DB_URL = config.database;
mongoose.connect(DB_URL, { useMongoClient: true });
const db = mongoose.connection;

// const User = require('../models/user.js');

db.on('error', function (err) {
    console.log('Mongoose connection error: ' + err);
});


db.on('connected', function () {
    console.log('Mongoose connected to ' + DB_URL);
});

db.once('open', function () {
    console.log('Mongoose connecting to ' + DB_URL);    
});

  // create the user schema
  var UserSchema = new mongoose.Schema({
	username: { type:String, required:true, unique:true, index:true },
	avatar:   { type:String, default:'images/placeholder.png'},
	password: { type:String },
	joindate: { type:Date, default:Date.now },
	points:   { type:Number },
	rank:     { type:Number },
},
    // When no collection argument is passed, Mongoose pluralizes the name.
    { collection: 'users' }
);

// UserSchema.set('collection', 'users');
var User = mongoose.model('User', UserSchema, 'users');
console.log('User Model Created.');
// create graph schema
var GraphSchema = new mongoose.Schema({
    from: { type: Number },
    to: { type: Number },
    supNum: { type: Number },
    oppNum: { type: Number },
    supporters: [
        {
            username: { type: String },
            direction: { type: String },
        }
    ],
    opposers: [
        {
            username: { type: String },
            direction: { type: String },
        }
    ]
}, { collection: 'graph' });
var Link = mongoose.model('Link', GraphSchema, 'graph');
console.log('Graph Model Created.');

db.on('disconnected', function () {
    console.log('Mongoose connection disconnected');
});

module.exports = mongoose;