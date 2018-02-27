const mongoose=require("mongoose");

var ActionSchema=new mongoose.Schema({
        round_id: { type: Number,required: true, index:true },  
        action_id: { type: Number,required: true, index:true },
        time_stamp: { type: String }, // formatted time, e.g. 2017-10-31 14:00:20
        player_name: { type: String }, // playername
        // by_system: { type: Boolean }, // if assisted by system recommendation
        operation: { type: String }, // [++/+/--/-]
        from: { type: String },
        direction: {type: String },
        to: { type: String },
        contribution: { type: Number } // the player's contribution of this action
});

console.log('Action Schema Created.');

exports.Action = mongoose.model('Action', ActionSchema);