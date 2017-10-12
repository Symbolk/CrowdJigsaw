/**
 * 使用 express.Router 类创建模块化、可挂载的路由句柄。
 * 路由级中间件和应用级中间件一样，只是它绑定的对象为 express.Router()。
 */

var express = require('express');
var router = express.Router();
const DBHelp=require('./DBHelp');
const mongoose=require('mongoose');
var LinkModel=mongoose.model('Link');


// Get Home Page
router.get('/', function(req, res, next)
{
  res.render('index', { title: 'Crowd Jigsaw Puzzle' });
});

/* Test DB API */
router.get('/apitest', function(req, res, next){
    res.render('apitest', {title: 'Testing Database API'});
});

// Login
//返回一个路由的一个实例，你可以用于处理HTTP动态请求使用可选的中间件。使用router.route()是一种推荐的方法来避免重复路由命名和拼写错误.。
router.route('/login').all(Logined).get(function(req,res)
{
    res.render('login',{title:'Login'});
}).post(function(req,res)
{
    //从前端获取到的用户填写的数据
    if(req.body.password== null || req.body.password == undefined || req.body.password== ''){
        // res.render('reset', {title : 'Reset Password'});
        return res.redirect('/reset');
    }else{

        let user={username:req.body.username,password:req.body.password};
        //用于查询用户名是否存在的条件
        let selectStr={username:user.username};
        let dbhelp=new DBHelp();
        dbhelp.FindOne('users',selectStr,function(result)
        {
            if(result)
            {
                if(result.password===user.password)
                {
                    //出于安全，只把包含用户名的对象存入session
                    req.session.user=selectStr;
                    return res.redirect('/home');
                }
                else
                {
                    req.session.error='Wrong username or password!';
                    return res.redirect('/login');
                }
            }
            else
            {
                req.session.error='Account not exists!';
                return res.redirect('/login');
            }
    });
    }
});


// Register
router.route('/register').all(Logined).get(function(req,res)
{
    res.render('register',{title:'Register'});
}).post(function(req,res)
{
    //从前端获取到的用户填写的数据
    let newUser={username:req.body.username,password:req.body.password,passwordSec:req.body.passwordSec};
    //准备添加到数据库的数据（数组格式）
    let addStr=[{username:newUser.username,password:newUser.password}];
    //用于查询用户名是否存在的条件
    // let selectStr={username:newUser.username};
    let dbhelp=new DBHelp();
    dbhelp.FindOne('users',{username:newUser.username},function(result)
    {
        if(!result)
        {
            if(newUser.password===newUser.passwordSec)
            {
                dbhelp.Add('users',addStr,function()
                {
                    req.session.error='Login success, you can login now!';
                    return res.redirect('/login');
                });
            }
            else
            {
                req.session.error='Passwords do not agree with each other!';
                return res.redirect('/register');
            }
        }
        else
        {
            req.session.error='Username exists, please choose another one!';
            return res.redirect('/register');
        }
    });
});


//Home用户管理
router.route('/home').all(LoginFirst).get(function(req,res)
{
    let selectStr={username:1,_id:0}
    let dbhelp=new DBHelp();
    dbhelp.FindAll('users',selectStr,function(result)
    {
        if(result)
        {
            res.render('home',{title:'Home'});
        }
        else
        {
            res.render('home',{title:'Home'});
        }
    });
});

// Puzzle
router.route('/puzzle').all(LoginFirst).get(function(req,res)
{
    let selectStr={username:1,_id:0}
    res.render('puzzle', {title:'Puzzle'});
});


// Reset Password
router.route('/reset').get(function(req,res)
{
    res.render('reset',{title:'Reset Password'});
}).post(function(req,res)
{
    if(req.body.username== null || req.body.username == undefined || req.body.username== ''){
        req.session.error="Please input username first!";
        return res.redirect('/reset');
    }else{
            let whereStr={username:req.body.username};
            let update={$set:{password:'123456'}};
            let dbhelp=new DBHelp();
            dbhelp.Update('users',whereStr,update,function()
            {
                req.session.error=whereStr.username+'\'s password has been reset to 123456!';
                return res.redirect('/login');
            });
    }
});

// Rank
router.route('/rank').all(LoginFirst).get(function(req,res)
{
    let selectStr={username:1,_id:0}
    let dbhelp=new DBHelp();
    dbhelp.FindAll('users',selectStr,function(result)
    {
        if(result)
        {
            res.render('rank',{title:'Ranks',Allusers:result});
        }
        else
        {
            res.render('rank',{title:'Ranks'});
        }
    });
});


// Log out
router.get('/logout',function(req,res)
{
    req.session.user=null;
    return res.redirect('/');
});

function Logined(req,res,next)
{
    if(req.session.user)
    {
        req.session.error='You already Logged In!';
        return res.redirect('/home');
    }
    //如果当前中间件没有终结请求-响应循环，则必须调用 next() 方法将控制权交给下一个中间件，否则请求就会挂起。
    next();
}

function LoginFirst(req,res,next)
{
    if(!req.session.user)
    {
        req.session.error='Please Login First!';
        return res.redirect('/login');
        //return res.redirect('back');//返回之前的页面
    }
    next();
}

// Graph Operations

router.route('/create').get(function(req,res)
{
    LinkModel.create({from:1, to:5}, function(err, doc){
        if(err){
            console.log(err);
        }else{
            req.session.error='Saved!';
            LinkModel.find({}, function(err, doc){
                console.log(doc);
            });
        }
    });
    return res.redirect('/apitest');
});



module.exports = router;