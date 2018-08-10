const mongoose=require("mongoose");

var COGSchema=new mongoose.Schema({
        round_id: { type: Number,required: true, index:true },  
        time: { type: Number,required: true, index:true }, // time from roundStart
        correctLinks: { type: Number, required: true },
        completeLinks: { type: Number, required: true },
        totalLinks: { type: Number, required: true },
        edges_changed: { type: Object, required: true },
});

console.log('[OK] COG Schema Created.');

exports.COG = mongoose.model('COG', COGSchema);