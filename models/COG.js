const mongoose=require("mongoose");

var CogSchema=new mongoose.Schema({
        round_id: { type: Number,required: true, index:true },  
        time: { type: Number,required: true, index:true }, // time from roundStart
        correctLinks: { type: Number, required: true },
        correctHints: { type: Number},
        completeLinks: { type: Number, required: true },
        totalLinks: { type: Number, required: true },
        ga_edges: { type: Object},
        hints: { type: Object},
        nodes: { type: Object},
        edges_saved: { type: Object, required: true },
});

console.log('[OK] Cog Schema Created.');

exports.Cog = mongoose.model('Cog', CogSchema);