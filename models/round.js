const mongoose = require("mongoose"); 

// Create the round schema
var RoundSchema = new mongoose.Schema({
    round_id: { type: Number, required: true, unique: true, index: true }, //inc
    // puzzle info
    image: { type: String, required: true }, //image url
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
    // round info
    creator: { type: String }, //creator of the round
    create_time: { type: String, default: "-1" },  // when the round borns, formatted time, e.g. 2017-10-31 14:00:20
    start_time: { type: String, default: "-1" },  // when the round starts, formatted time, e.g. 2017-10-31 14:00:20
    end_time: { type: String, default: "-1" },  // when the round dies, formatted time, e.g. 2017-10-31 14:00:20
    players_num: { type: Number, required: true, default: 1 }, // set by creator
    online_players: [ // online playing users in this round
        {
            player_name: { type: String },
            join_time: { type: String } // formatted time, e.g. 2017-10-31 14:00:20                        
        }
    ], 
    players: [ 
        {
            player_name: { type: String },
            join_time: { type: String }, // formatted time, e.g. 2017-10-31 14:00:20
            contribution: { type: Number, default:0 }// the real time contribution of the player
        }
    ],
    // crowd results
    MVP: { type: String },  // who solves the round first with the power of the crowd
    collective_time: { type: String, default: "-1" }, // when the round is solved by crowd(the fastest)(-1:unsolved))
    collective_steps: { type: Number, default: -1 }, // steps the round is solved by crowd(the fastest)(-1:unsolved))
    total_links: { type: String, default: "-1" }, // # of total links in the jigsaw puzzle
    hinted_links: { type: String, default: "-1" }, // # of hinted links for the MVP
    // solver results
    // solver_time: { type: String, default: "-1" }, // when the round is solved by the crowd-based solver(-1:unsolved)
    // solver_gen: { type: Number, default: -1}, // in which generation the round is solved(-1:unsolved)
    // solver_best_fitness: { type: Number, default: -1}, // the fitness of the correct individual in the solver(-1:unsolved)
    // persistent edges data
    edges_saved: { type: Object },
    contribution: { type: Object }
}, { collection: 'rounds' });


// var Round = mongoose.model('Round', RoundSchema, 'rounds');
console.log('Round Schema Created.');


exports.Round = mongoose.model('Round', RoundSchema);