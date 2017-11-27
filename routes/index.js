'use strict'
/**
 * 使用 express.Router 类创建模块化、可挂载的路由句柄。
 * 路由级中间件和应用级中间件一样，只是它绑定的对象为 express.Router()。
 */

var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
var UserModel = require('../models/user').User;
var LinkModel = require('../models/link').Link;
var crypto = require('crypto');

const SECRET = "CrowdIntel";

/**
 *  MD5 encryption
 *  let md5 = crypto.createHash("md5");
 *  let newPas = md5.update(password).digest("hex");
 */
function encrypt(str, secret) {
    var cipher = crypto.createCipher('aes192', secret);
    var enc = cipher.update(str, 'utf8', 'hex');
    // var enc=cipher.update(new Buffer(str, 'utf-8'));
    enc += cipher.final('hex');
    return enc;
}
function decrypt(str, secret) {
    var decipher = crypto.createDecipher('aes192', secret);
    var dec = decipher.update(str, 'hex', 'utf8');
    dec += decipher.final('utf8');
    return dec;
}

function getNowFormatDate() {
    var date = new Date();
    var seperator1 = "-";
    var seperator2 = ":";
    var month = date.getMonth() + 1;
    var strDate = date.getDate();
    if (month >= 1 && month <= 9) {
        month = "0" + month;
    }
    if (strDate >= 0 && strDate <= 9) {
        strDate = "0" + strDate;
    }
    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
        + " " + date.getHours() + seperator2 + date.getMinutes()
        + seperator2 + date.getSeconds();
    return currentdate;
}


// Get Home Page
router.get('/', function (req, res, next) {
    req.session.error = 'Welcome to Crowd Jigsaw Puzzle!';
    res.render('index', { title: 'Crowd Jigsaw Puzzle' });
});

// Login
//返回一个路由的一个实例，你可以用于处理HTTP动态请求使用可选的中间件。使用router.route()是一种推荐的方法来避免重复路由命名和拼写错误.。
router.route('/login').all(Logined).get(function (req, res) {
    res.render('login', { title: 'Login' });
}).post(function (req, res) {
    //从前端获取到的用户填写的数据
    let passwd_enc = encrypt(req.body.password, SECRET);
    let user = { username: req.body.username, password: passwd_enc };
    //用于查询用户名是否存在的条件
    let condition = { username: user.username };
    UserModel.findOne(condition, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            if (doc) {
                if (doc.password === user.password) {
                    //出于安全，只把包含用户名的对象存入session
                    req.session.user = condition;
                    let operation = {
                        $set: {
                            last_online_time: getNowFormatDate()
                        }
                    };
                    UserModel.update(operation, function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            req.session.error = 'Welcome! ' + user.username;
                            return res.redirect('/home');
                        }
                    });
                }
                else {
                    req.session.error = 'Wrong username or password!';
                    return res.redirect('/login');
                }
            } else {
                req.session.error = 'Player does not exist!';
                return res.redirect('/login');
            }
        }
    });
});

/**
 * Log in as a visitor
 */
router.route('/visitor').get(function (req, res) {
    UserModel.find({}, function (err, docs) {
        if (err) {
            console.log(err);
        } else {
            var index = docs.length;
            let operation = {
                userid: index,
                username: 'Visitor ' + index,
                password: "",
                last_online_time: getNowFormatDate(),
                register_time: getNowFormatDate()
            };
            let user = { username: operation.username };
            UserModel.create(operation, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    req.session.user=user
                    req.session.error = 'Welcome! ' + operation.username;
                    return res.redirect('/home');
                }
            });
        }
    });

});


// Register
router.route('/register').all(Logined).get(function (req, res) {
    res.render('register', { title: 'Register' });
}).post(function (req, res) {
    //从前端获取到的用户填写的数据
    let passwd_enc = encrypt(req.body.password, SECRET);
    let passwd_sec_enc = encrypt(req.body.passwordSec, SECRET);

    let newUser = { username: req.body.username, password: passwd_enc, passwordSec: passwd_sec_enc };
    UserModel.find({}, function (err, docs) {
        if (err) {
            console.log(err);
        } else {
            var index = docs.length;
            //准备添加到数据库的数据（数组格式）
            let operation = {
                userid: index,
                username: newUser.username,
                password: newUser.password,
                last_online_time: getNowFormatDate(),
                register_time: getNowFormatDate()
            };
            //用于查询用户名是否存在的条件
            // let selectStr={username:newUser.username};
            UserModel.findOne({ username: newUser.username }, function (err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    if (!doc) {
                        if (newUser.password === newUser.passwordSec) {
                            UserModel.create(operation, function (err) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    req.session.error = 'Register success, you can login now!';
                                    return res.redirect('/login');
                                }
                            });
                        } else {
                            req.session.error = 'Passwords do not agree with each other!';
                            return res.redirect('/register');
                        }
                    } else {
                        req.session.error = 'Username exists, please choose another one!';
                        return res.redirect('/register');
                    }
                }
            });
        }
    });
});


//Home 
router.route('/home').all(LoginFirst).get(function (req, res) {
    let selectStr = { username: req.session.user.username };
    let fields = { _id: 0, username: 1, avatar: 1 };
    UserModel.findOne(selectStr, fields, function (err, docs) {
        if (err) {
            console.log(err);
        } else {
            if (docs) {
                req.session.error = 'Welcome! ' + req.session.user.username;
                res.render('home', { title: 'Home', username: req.session.user.username });
            } else {
                res.render('home', { title: 'Home' });
            }
        }
    });
});

// Puzzle
// router.route('/puzzle').all(LoginFirst).get(function (req, res) {
//     // let selected_level=req.query.level;
//     req.session.error = 'Game Started!';
//     res.render('puzzle', { title: 'Puzzle' });
// });

// Round
router.route('/rounddisplay').all(LoginFirst).get(function (req, res) {  
    res.render('rounddisplay', { title: 'Round', username: req.session.user.username});
});

router.route('/puzzle').all(LoginFirst).get(function (req, res) {
    let level = req.param('level');
    let roundID = req.param('roundID');
    let image = req.param('image');
    res.render('puzzle', { title: 'Puzzle', level: level, roundID: roundID, image: image});
});


// Reset Password
router.route('/reset').get(function (req, res) {
    res.render('reset', { title: 'Reset Password' });
}).post(function (req, res) {
    if (req.body.username == null || req.body.username == undefined || req.body.username == '') {
        req.session.error = "Please input username first!";
        return res.redirect('/reset');
    } else {
        let user = { username: req.body.username };
        let selectStr = { username: user.username };

        UserModel.findOne(selectStr, function (err, doc) {
            if (err) {
                console.log(err);
            } else {
                if (doc) {
                    let whereStr = { username: req.body.username };
                    let update = { $set: { password: encrypt(whereStr.username, SECRET) } };
                    UserModel.update(whereStr, update, function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            req.session.error = whereStr.username + '\'s password has been reset to YOUR NAME!';
                            return res.redirect('/login');
                        }
                    });
                } else {
                    req.session.error = 'Player not exists!';
                    return res.redirect('/reset');
                }
            }
        });
    }
});

// Account Settings
router.route('/settings').all(LoginFirst).get(function (req, res) {
    req.session.error = 'Change Password Here!';
    res.render('settings', { title: 'Player Settings', username: req.session.user.username });
}).post(function (req, res) {
    if (req.body.new_password != req.body.new_passwordSec) {
        req.session.error = 'Passwords do not agree with each other!';
        return res.redirect('/settings');
    } else {
        // Change the password
        let condition = {
            username: req.session.user.username
        };

        UserModel.findOne(condition, function (err, doc) {
            if (err) {
                console.log(err);
            } else {
                if (doc.password === encrypt(req.body.old_password, SECRET)) {
                    let operation = {
                        $set: {
                            password: encrypt(req.body.new_password, SECRET),
                        }
                    };
                    UserModel.update(condition, operation, function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            req.session.error = 'Successfully reset your password!';
                            return res.redirect('/home');
                        }
                    });
                } else {
                    req.session.error = 'The old password is wrong!';
                    return res.redirect('/settings');
                }
            }
        });

    }
});


// Rank
router.route('/rank').all(LoginFirst).get(function (req, res) {
    req.session.error = 'Players Rank!';
    let fields = { username: 1, rank: 1, _id: 0 }
    UserModel.find({}, function (err, docs) {
        if (err) {
            console.log(err);
        } else {
            res.render('rank', { title: 'Ranks', Allusers: docs, username: req.session.user.username });
        }
    });
    // UserModel.find({}, {sort: [['_id', -1]]}, function(err, docs){
    //     if (err) {
    //         console.log(err);
    //     } else {
    //         res.render('rank', { title: 'Ranks', Allusers: docs, username: req.session.user.username });
    //     }
    // });
});


// Personal Records
router.route('/records').all(LoginFirst).get(function (req, res) {
    req.session.error = 'See Your Records!';
    let condition = {
        username: req.session.user.username
    };
    UserModel.findOne(condition, function (err, doc) {
        if (err) {
            res.render('records', { title: 'Personal Records' });
            console.log(err);
        }
        else {
            res.render('records', { title: 'Ranks', username: req.session.user.username, Allrecords: doc.records });
        }
    });
});

// Help page
router.route('/help').all(LoginFirst).get(function (req, res) {
    // TODO    
    req.session.error = 'Get into Trouble?';
    res.render('help', { title: 'Help', username: req.session.user.username });
});



// Log out
router.get('/logout', function (req, res) {
    req.session.user = null;
    req.session.error = null;
    return res.redirect('/login');
});

function Logined(req, res, next) {
    if (req.session.user) {
        req.session.error = 'You already Logged In!';
        return res.redirect('/home');
    }
    //如果当前中间件没有终结请求-响应循环，则必须调用 next() 方法将控制权交给下一个中间件，否则请求就会挂起。
    next();
}

function LoginFirst(req, res, next) {
    if (!req.session.user) {
        req.session.error = 'Please Login First!';
        return res.redirect('/login');
        //return res.redirect('back');//返回之前的页面
    }
    next();
}

/**
 * Get hint tile indexes from the server
 * 1, find all links from the selected tile
 * 2, update their hintScore and hintDir
 * 3, sort the links by hintScore desc
 * 4, return the hintIndexes in direction order
 */
router.get('/getHints/:from', function (req, res) {
    let condition = {
        from: req.params.from
    };
    LinkModel.find(condition, function (err, docs) {
        if (err) {
            console.log(err);
        } else {
            // update the score and dir of every link
            for (let d of docs) {
                condition = {
                    from: req.params.from,
                    to: d.to
                };
                let score = d.supNum;
                // calculate the direction
                let counter = new Array(0, 0, 0, 0);//k:v=dir:num
                for (let s of d.supporters) {
                    counter[s.direction] += 1;
                }
                let dir = counter.indexOf(Math.max.apply(Math, counter));
                let operation = {
                    $set:
                        {
                            hintScore: score,
                            hintDir: dir
                        }
                };
                LinkModel.update(condition, operation, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Scored ' + score);
                    }
                });
            }
            condition = {
                from: req.params.from
            };
            let hintIndexes = new Array(-1, -1, -1, -1);
            LinkModel.find(condition)
                .sort({ score: -1 })
                .limit(4)
                .exec(function (err, docs) {
                    if (err) {
                        console.log(err);
                    } else {
                        for (let d of docs) {
                            hintIndexes[Number(d.hintDir)] = d.to;
                        }
                        // console.log(hintIndexes);
                        res.send(JSON.stringify(hintIndexes));
                    }
                });
        }
    });
});


module.exports = router;