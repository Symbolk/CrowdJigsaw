const mongoose=require('mongoose');

var db=mongoose.connection;
db.on('error', function callback(){
    console.log('Connection error!');
});

db.once('open', function callback(){
    var TodoSchema = new mongoose.Schema({
        user_id: String, //定义一个属性user_id，类型为String
        content: String, //定义一个属性content，类型为String
        updated_at: Date //定义一个属性updated_at，类型为Date
    });
    
    mongoose.model('Todo', TodoSchema); //将该Schema发布为Model
    console.log('Connected!');
});

mongoose.connect('mongodb://localhost/userinfo');

module.exports=mongoose;