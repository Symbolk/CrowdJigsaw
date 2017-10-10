const User=require('./user.js');

function insert(){
    // Entity CRUD
    let user=new User({
        username: 'Symbol',
        password: 'cars123',
        joindate: new Date(),
        points:   0,
        rank:     0,
    });
    user.save(function(err, res){
        if(err){
            console.log(`Error: `+err);
        }else{
            console.log(`Res: `+res);
        }
    });
}

function update(){
    var wherestr = {'username' : 'Tracy McGrady'};
    var updatestr = {'userpwd': 'zzzz'};
    
    User.update(wherestr, updatestr, function(err, res){
        if (err) {
            console.log("Error:" + err);
        }
        else {
            console.log("Res:" + res);
        }
    });
}

function findByIdAndUpdate(){
    var id = '56f2558b2dd74855a345edb2';
    var updatestr = {'userpwd': 'abcd'};
    // Model和Entity都有能影响数据库的操作，但仍有区别
    // Model find
    User.findByIdAndUpdate(id, updatestr, function(err, res){
        if (err) {
            console.log("Error:" + err);
        }
        else {
            console.log("Res:" + res);
        }
    });
}

function getCountByConditions(){
    var wherestr = {};
    
    User.count(wherestr, function(err, res){
        if (err) {
            console.log("Error:" + err);
        }
        else {
            console.log("Res:" + res);
        }
    });
}


function getById(){
    var id = '56f261fb448779caa359cb73';
    
    User.findById(id, function(err, res){
        if (err) {
            console.log("Error:" + err);
        }
        else {
            console.log("Res:" + res);
        }
    });
}
