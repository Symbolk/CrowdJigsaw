const mongoose = require('mongoose');
const config = require('./config/dev');

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
    username: { type: String, required: true, unique: true, index: true },
    avatar: { type: String, default: 'images/placeholder.png' },
    password: { type: String }, // encrypted with crypto
    register_time: { type: String, default: Date.now }, // formatted time, e.g. 2017-10-31 14:00:20
    records: [
        {
            round_id: { type: Number }, // participated rounds
            join_time: { type: String },
            start_time: { type: String, default: "-1" }, // formatted time, e.g. 2017-10-31 14:00:20
            end_time: { type: String, default: "-1" }, // formatted time, e.g. 2017-10-31 14:00:20
            steps: { type: String, default: "-1" }, // -1=unfininshed
            time: { type: String, default: "-1" }, // hour:min:sec, e.g. 16:41
            contribution: { type: Number, default: -1 }// a contribution score, calculated when one round end
        }
    ],
    // rank: { type: Number, default: 0 }
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
    ],
    hintScore: { type: Number, default: -1 },
    hintDir: { type: Number, default: -1 }
}, { collection: 'graph' });
var Link = mongoose.model('Link', GraphSchema, 'graph');
console.log('Graph Model Created.');

// Create the round schema
var RoundSchema = new mongoose.Schema({
    round_id: { type: Number, required: true, unique: true, index: true }, //inc
    creator: { type: String }, //creator of the round
    image: { type: String, required: true }, //image url
    shape: { type: String, required: true }, // jagged or square
    level: { type: Number, required: true }, //1-4
    create_time: { type: String, default: "-1" },  // formatted time, e.g. 2017-10-31 14:00:20
    start_time: { type: String, default: "-1" },  // formatted time, e.g. 2017-10-31 14:00:20
    end_time: { type: String, default: "-1" },  // formatted time, e.g. 2017-10-31 14:00:20
    players_num: { type: Number, required: true, default: 1 }, // set by creator
    players: [ // ONLINE players
        {
            player_name: { type: String },
            join_time: { type: String }, // formatted time, e.g. 2017-10-31 14:00:20
        }
    ],
    // all past and now players can give sequences
    sequences: [
        {
            time_stamp: { type: String }, // formatted time, e.g. 2017-10-31 14:00:20
            agent: { type: String }, // playername
            by_system: { type: Boolean }, // if assisted by system recommendation
            operation: { type: String }, // [++/+/--/-]
            from: { type: String }, // e.g. 1.3++3.2
            to: { type: String }
        }
    ],
    edges: [
        {
            from: { type: String },
            to: { type: String },
            sup_num: { type: Number },
            supporters: [
                {
                    player_name: { type: String },
                    contribution: { type: Number }
                }
            ],
            opp_num: { type: Number },
            opposers: [
                {
                    player_name: { type: String },
                    contribution: { type: Number }
                }
            ]
        }
    ],
    collective_time: { type: String, default: "-1" } //"-1"=unfinished
}, { collection: 'rounds' });
var Link = mongoose.model('Round', RoundSchema, 'rounds');
console.log('Round Model Created.');


db.on('disconnected', function () {
    console.log('Mongoose connection disconnected');
});

module.exports = mongoose;