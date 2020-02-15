const mongoose = require("mongoose"); 

// Create the round schema
var RoundSchema = new mongoose.Schema({
    round_id: { type: Number, required: true, unique: true, index: true }, //inc
    // puzzle info
    algorithm: { type: String, default: 'distribute'},
    image: { type: String, required: true }, //image url
    difficult: {type: Number},
    imageWidth: { type: Number},
    imageHeight: { type: Number},
    shape: { type: String, required: true }, // jagged or square
    tileWidth: {type: Number, required: true, default: 64},
    shapeArray: { type: String, default: "" }, // jagged or square
    level: { type: Number, required: true }, //1-3
    edge: { type: Boolean, default: false }, // whether the tile has edge
    official: { type: Boolean, default: false }, // whether the tile has edge
    tileHeat: {type: Boolean, default: false},
    hintDelay: {type: Boolean, default: true},
    originSize: {type: Boolean, default: false},
    outsideImage: {type: Boolean, default: false},
    forceLeaveEnable: { type: Boolean, default: false }, // whether the tile has edge
    border: { type: Boolean, default: false },// whether the tile has border
    tilesPerRow:  { type: Number, default: -1 },
    tilesPerColumn:  { type: Number, default: -1 },
    tile_num: { type: Number, default: -1 },
    // round info
    creator: { type: String }, //creator of the round
    create_time: { type: String, default: "-1" },  // when the round borns, formatted time, e.g. 2017-10-31 14:00:20
    start_time: { type: String, default: "-1" },  // when the round starts, formatted time, e.g. 2017-10-31 14:00:20
    end_time: { type: String, default: "-1" },  // when the round dies, formatted time, e.g. 2017-10-31 14:00:20
    players_num: { type: Number, required: true, default: 1 }, // set by creator
    // crowd results
    solved_players: { type: Number, default: 0 }, // how many players solves the round
    winner: { type: String },  // who solves the round first with the power of the crowd
}, { collection: 'rounds' });


// var Round = mongoose.model('Round', RoundSchema, 'rounds');
console.log('[OK] Round Schema Created.');
exports.Round = mongoose.model('Round', RoundSchema);