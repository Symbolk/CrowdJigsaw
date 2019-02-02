const mongoose = require("mongoose"); 
// create the user schema
var UserSchema = new mongoose.Schema({
    userid: { type: Number, required: true, unique: true, index: true },
    username: { type: String, required: true, unique: true, index: true },
    avatar: { type: String, default: 'images/placeholder.png' },
    password: { type: String }, // encrypted with crypto
    last_online_time:  { type: String }, // formatted time, e.g. 2017-10-31 14:00:20
    register_time: { type: String }, // formatted time, e.g. 2017-10-31 14:00:20
    admin: { type: Boolean, default: false }, // only admin can new rounds&see images
}, { collection: 'users' });

// UserSchema.set('collection', 'users');
// var User = mongoose.model('User', UserSchema, 'users');
console.log('[OK] User Schema Created.');

exports.User = mongoose.model('User', UserSchema);