const mongoose = require("mongoose"); 

// Create the round schema
var RoundSchema = new mongoose.Schema({
    round_id: { type: Number, required: true, unique: true, index: true }, //inc
    creator: { type: String }, //creator of the round
    image: { type: String, required: true }, //image url
    thumbImage: { type: String, required: true }, //thumb image url
    imageWidth: { type: Number}, //image url
    imageHeight: { type: Number}, //image url
    shape: { type: String, required: true }, // jagged or square
    tileWidth: {type: Number, required: true, default: 64},
    shapeArray: { type: String, default: "" }, // jagged or square
    level: { type: Number, required: true }, //1-3
    edge: { type: Boolean, default: false }, // whether the tile has edge
    border: { type: Boolean, default: false },// whether the tile has border
    row_num:  { type: Number, default: -1 },
    tilesPerRow:  { type: Number, default: -1 },
    tilesPerColumn:  { type: Number, default: -1 },
    tile_num: { type: Number, default: -1 },
    create_time: { type: String, default: "-1" },  // formatted time, e.g. 2017-10-31 14:00:20
    start_time: { type: String, default: "-1" },  // formatted time, e.g. 2017-10-31 14:00:20
    end_time: { type: String, default: "-1" },  // formatted time, e.g. 2017-10-31 14:00:20
    players_num: { type: Number, required: true, default: 1 }, // set by creator
    players: [ // online playing users
        {
            player_name: { type: String },
            join_time: { type: String }, // formatted time, e.g. 2017-10-31 14:00:20
            contribution: { type: Number, default:0 }// the real time contribution of the player
        }
    ],
    // // all past and now players can give sequences
    // actions: [

    // ],
    // graph = a set of nodes
    // graph: [ { type: mongoose.Schema.Types.ObjectId, ref: 'Node' } ],
    collective_time: { type: String, default: "-1" } //"-1"=unfinished
}, { collection: 'rounds' });


// var Round = mongoose.model('Round', RoundSchema, 'rounds');
console.log('Round Schema Created.');


exports.Round = mongoose.model('Round', RoundSchema);