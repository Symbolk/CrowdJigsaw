/**
 * Undirected edges in the Collective Opinion Graph 
 */
const mongoose = require("mongoose");

var EdgeSchema = new mongoose.Schema({
    round_id:{ type: Number,required: true, index:true  }, // round_id in which the edge exists
    // nodes the edge connects
    x: { type: Number }, 
    y: { type: Number },
    tag: { type: String }, // label/tag of the edge, L-R or T-B
    supporters: [
        {
            player_id: { type: Number }, // unique id of the player
            player_name: { type: String },
            weight: { type: Number, default: 0 } // the positive weight
        }
    ],
    opposers: [
        {
            player_id: { type: Number },             
            player_name: { type: String },
            weight: { type: String, default: 0 }, // the negative weight
        }
    ],
    confidence: { type: Number, default: -1 }, // the overall confidence of the edge
});

// var Link = mongoose.model('Link', NodeSchema, 'links');
console.log('Edge Schema Created.');


exports.Edge = mongoose.model('Edge', EdgeSchema);
