var express = require('express');
var router = express.Router();
const DBHelp=require('./DBHelp');

/* GET home page. */
router.get('/', function(req, res, next)
{
  res.render('index', { title: 'Crowd Jigsaw Puzzle' });
});


//登录
router.route('/login').all(Logined).get(function(req,res)
{
    res.render('login',{title:'Login'});
}).post(function(req,res)
{
    //从前端获取到的用户填写的数据
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
                req.session.error='用户名或者密码错误！';
                return res.redirect('/login');
            }
        }
        else
        {
            req.session.error='账号不存在！';
            return res.redirect('/login');
        }
    });
});


//注册
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
                    req.session.error='注册成功，请登录！';
                    return res.redirect('/login');
                });
            }
            else
            {
                req.session.error='两次密码不一致！';
                return res.redirect('/register');
            }
        }
        else
        {
            req.session.error='用户名已存在！';
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
            res.render('home',{title:'Home',Allusers:result});
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


//删除
router.route('/delete/:URLusername').get(function(req,res)
{
    if(req.params.URLusername!==req.session.user.username)
    {
        let whereStr={username:req.params.URLusername};
        let dbhelp=new DBHelp();
        dbhelp.Delete('users',whereStr,function()
        {
            req.session.error='移除用户 '+whereStr.username+' 成功！';
            return res.redirect('/home');
        });
    }
    else
    {
        req.session.error="不能操作当前登录用户！";
        return res.redirect('/home');
    }
});

//重置密码
router.get('/resetPwd/:URLusername',function(req,res)
{
    if(req.params.URLusername!==req.session.user.username)
    {
        let whereStr={username:req.params.URLusername};
        let update={$set:{password:'123456'}};
        let dbhelp=new DBHelp();
        dbhelp.Update('users',whereStr,update,function()
        {
            req.session.error=whereStr.username+' 的密码已重置为 123456！';
            return res.redirect('/home');
        });
    }
    else
    {
        req.session.error="不能操作当前登录用户！";
        return res.redirect('/home');
    }
});

//注销
router.get('/logout',function(req,res)
{
    req.session.user=null;
    return res.redirect('/');
});

function Logined(req,res,next)
{
    if(req.session.user)
    {
        req.session.error='您已登录！';
        return res.redirect('/home');
    }
    next();
}

function LoginFirst(req,res,next)
{
    if(!req.session.user)
    {
        req.session.error='请先登录!';
        return res.redirect('/login');
    }
    next();
}

module.exports = router;