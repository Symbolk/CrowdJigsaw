const mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({
	username: { type:String, required:true, unique:true, index:true },
	avatar:   { type:String, default:'images/placeholder.png'},
	password: { type:String },
	joindate: { type:Date, default:Date.now },
	points:   { type:Number },
	rank:     { type:Number },
},
{collection:'users'}
);	

// 如果是Entity，使用save方法，如果是Model，使用create方法
// 如果使用Model新增时，传入的对象只能是纯净的JSON对象
UserSchema.methods.createUser = function(){
	console.log('New');
}

// 删除也有2种方式，但Entity和Model都使用remove方法

// UserSchema.methods.findUserByName = function(cb){
// 	return this.model('User').find({username:this.username}, cb);
// }

UserSchema.statics.findUserByName = function(name, cb){
	this.find({username:new RegExp(name, 'i'), cb});
}

// // 虚拟属性，不写入数据库
// UserSchema.virtual('name.full').set(function(name){
	
// })

// Publish the schema as the model
module.exports=mongoose.model('users', UserSchema);