const mongoose = require("mongoose");

var ImagesSchema = new mongoose.Schema({
    image_path: { type: String, rquired: true },// image relative path
    row_num: { type: Number },
    col_num: { type: Number },
    difficult: { type: Number }
});

console.log('[OK] Images Schema Created.');

exports.Images = mongoose.model('Images', ImagesSchema);