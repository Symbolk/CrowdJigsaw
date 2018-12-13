const mongoose=require("mongoose");

var DiffSchema=new mongoose.Schema({
        round_id: { type: Number, required: true, index:true },  
        time: { type: Number, required: true, index:true }, // formatted time, e.g. 2017-10-31 14:00:20
        hints: { type: String},
        ga_edges: { type: String}
});

console.log('[OK] Diff Schema Created.');

exports.Diff = mongoose.model('Diff', DiffSchema);