const mongoose = require("mongoose"); 

var NodeSchema = new mongoose.Schema({
    index: { type: Number,required: true, index:true }, // index of the center node
    round_id:{ type: Number,required: true, index:true  },
    top:[{
        index: { type: Number },
        sup_num:  { type: Number, default:0 },
        opp_num:  { type: Number, default:0 },
        confidence:  { type: Number, default:0 },
        supporters: [
            {
                player_name: { type: String }
            }
        ],
        opposers: [
            {
                player_name: { type: String }
            }
        ]
    }],
    right:[{
        index: { type: Number },
        sup_num:  { type: Number, default:0 },
        opp_num:  { type: Number, default:0 },
        confidence:  { type: Number, default:0 },
        supporters: [
            {
                player_name: { type: String }
            }
        ],
        opposers: [
            {
                player_name: { type: String }
            }
        ]   
    }],
    bottom:[{
        index: { type: Number },
        sup_num:  { type: Number, default:0 },
        opp_num:  { type: Number, default:0 },
        confidence:  { type: Number, default:0 },
        supporters: [
            {
                player_name: { type: String }
            }
        ],
        opposers: [
            {
                player_name: { type: String }
            }
        ]  
    }],
    left:[{
        index: { type: Number },
        sup_num:  { type: Number, default:0 },
        opp_num:  { type: Number, default:0 },
        confidence:  { type: Number, default:0 },
        supporters: [
            {
                player_name: { type: String }
            }
        ],
        opposers: [
            {
                player_name: { type: String }
            }
        ]        
    }]
});

console.log('Node Schema Created.');

exports.Node = mongoose.model('Node', NodeSchema);