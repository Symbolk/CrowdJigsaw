const mongoose = require("mongoose"); 

var NodeSchema = new mongoose.Schema({
    index: { type: Number,required: true, index:true }, // index of the center node
    round_id:{ type: Number,required: true, index:true  },
    top:[{
        index: { type: Number },
        sup_num:  { type: Number, default:0 },
        opp_num:  { type: Number, default:0 }
    }],
    right:[{
        index: { type: Number },
        sup_num:  { type: Number, default:0 },
        opp_num:  { type: Number, default:0 }
    }],
    bottom:[{
        index: { type: Number },
        sup_num:  { type: Number, default:0 },
        opp_num:  { type: Number, default:0 },
    }],
    left:[{
        index: { type: Number },
        sup_num:  { type: Number, default:0 },
        opp_num:  { type: Number, default:0 },
    }]
});

console.log('Node Schema Created.');

exports.Node = mongoose.model('Node', NodeSchema);