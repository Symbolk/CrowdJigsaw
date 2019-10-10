const mongoose=require("mongoose");

var SurveySchema=new mongoose.Schema({
        round_id: { type: Number, required: true, index:true },  
        time: { type: Number,required: true, index:true }, // formatted time, e.g. 2017-10-31 14:00:20
        player_name: { type: String }, // playername
        survey_type: { type: String },
        extra: { type: String },
});

console.log('[OK] Survey Schema Created.');

exports.Survey = mongoose.model('Survey', SurveySchema);