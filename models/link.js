/**
 * Legacy
 */
var mongoose = require("mongoose"); 

var LinkSchema = new mongoose.Schema({
    from: { type: Number },
    to: { type: Number },
    supNum: { type: Number },
    oppNum: { type: Number },
    supporters: [
        {
            player_name: { type: String },
            direction: { type: String },
            effect: {type: Number,default:0 }// the effect of the player pose on the link:the later, the smaller
        }
    ],
    opposers: [
        {
            player_name: { type: String },
            direction: { type: String },
        }
    ],
    hintScore: { type: Number, default: -1 },
    hintDir: { type: Number, default: -1 }
});

// var Link = mongoose.model('Link', NodeSchema, 'links');
console.log('Link Schema Created.');


exports.Link = mongoose.model('Link', LinkSchema);
