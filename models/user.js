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
    records: [
        {
            round_id: { type: Number }, // participated rounds
            join_time: { type: String },
            start_time: { type: String, default: "-1" }, // formatted time, e.g. 2017-10-31 14:00:20
            end_time: { type: String, default: "-1" }, // formatted time, e.g. 2017-10-31 14:00:20
            steps: { type: Number, default: -1 }, // -1=unfininshed
            time: { type: String, default: "-1" }, // hour:min:sec, e.g. 16:41
            contribution: { type: Number, default: -1 }, // a contribution score, calculated when one round end
            total_links: { type: String, default: "-1" }, // # of total links in this puzzle
            hinted_links: { type: String, default: "-1" }, // # of hinted links the player got
            total_tiles: { type: String, default: "-1" }, // # of total links in this puzzle
            hinted_tiles: { type: String, default: "-1" }, // # of hinted links the player got
            correct_links: { type: String, default: "-1" },
            total_hints: { type: String, default: "-1" }, // # of total hints the player got
            correct_hints: { type: String, default: "-1" }, // # of correct hints the player got
            rating: { type: Number, default: -1 } // how the player feels about the hint
        }
    ],
    save_game: {
        round_id: { type: Number },
        steps: { type: Number },
        realSteps: { type: Number },
        startTime: { type: Number },
        maxSubGraphSize: { type: Number },
        tiles: { type: String}, // tile position
        tileHintedLinks: { type: String },
        totalHintsNum: { type: Number },
        correctHintsNum: { type: Number }
    }
},
    // When no collection argument is passed, Mongoose pluralizes the name.
    { collection: 'users' }
);

// UserSchema.set('collection', 'users');
// var User = mongoose.model('User', UserSchema, 'users');
console.log('[OK] User Schema Created.');

exports.User = mongoose.model('User', UserSchema);