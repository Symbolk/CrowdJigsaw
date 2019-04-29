const mongoose = require("mongoose"); 
// create the user schema
var RecordSchema = new mongoose.Schema({
    username: { type: String, required: true, index: true },
    round_id: { type: Number, required: true, index: true }, // participated rounds
    join_time: { type: String },
    start_time: { type: String, default: "-1" }, // formatted time, e.g. 2017-10-31 14:00:20
    end_time: { type: String, default: "-1" }, // formatted time, e.g. 2017-10-31 14:00:20
    steps: { type: Number, default: -1 }, // -1=unfininshed
    time: { type: String, default: "-1" }, // hour:min:sec, e.g. 16:41
    contribution: { type: Number, default: -1 }, // a contribution score, calculated when one round end
    total_links: { type: String, default: "-1" }, // # of total links in this puzzle
    hinted_links: { type: String, default: "-1" }, // # of hinted links the player got
    total_steps: { type: String, default: "-1" }, // # of total links in this puzzle
    hinted_steps: { type: String, default: "-1" }, // # of hinted links the player got
    correct_links: { type: String, default: "-1" },
    total_hints: { type: String, default: "-1" }, // # of total hints the player got
    correct_hints: { type: String, default: "-1" }, // # of correct hints the player got
    rating: { type: Number, default: -1 }, // how the player feels about the hint
    score: { type: Number, default: 0 },
    create_correct_link: { type: Number, default: 0 },
    remove_correct_link: { type: Number, default: 0 },
    create_wrong_link: { type: Number, default: 0 },
    remove_wrong_link: { type: Number, default: 0 },
    remove_hinted_wrong_link: { type: Number, default: 0 },
    edges: { type: Object},
    first_edges: { type: Object},
}, { collection: 'records' });

console.log('[OK] Record Schema Created.');

exports.Record = mongoose.model('Record', RecordSchema);