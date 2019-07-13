'use strict'
/**
 * 使用 express.Router 类创建模块化、可挂载的路由句柄。
 * 路由级中间件和应用级中间件一样，只是它绑定的对象为 express.Router()。
 */

var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
var UserModel = require('../models/user').User;
var RoundModel = require('../models/round').Round;
var crypto = require('crypto');
var util = require('./util.js');

const redis = require('redis').createClient();

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


// Get Home Page
router.get('/', function(req, res, next) {
    req.session.error = 'Welcome to Crowd Jigsaw Puzzle!';
    res.render('index', { title: 'Crowd Jigsaw Puzzle' });
});

// Login
//返回一个路由的一个实例，你可以用于处理HTTP动态请求使用可选的中间件。使用router.route()是一种推荐的方法来避免重复路由命名和拼写错误.。
router.route('/login').all(Logined).get(function(req, res) {
    res.render('login', { title: 'Login' });
}).post(function(req, res) {
    //从前端获取到的用户填写的数据
    let passwd_enc = encrypt(req.body.password, SECRET);
    let user = { username: req.body.username, password: passwd_enc };
    //用于查询用户名是否存在的条件
    let condition = { username: user.username };
    UserModel.findOne(condition, function(err, doc) {
        if (err) {
            console.log(err);
        } else {
            if (doc) {
                if (doc.password === user.password) {
                    //出于安全，只把包含用户名的对象存入session
                    req.session.user = condition;
                    let time = util.getNowFormatDate();
                    let operation = {
                        $set: {
                            last_online_time: time
                        }
                    };
                    UserModel.update(condition, operation, function(err) {
                        if (err) {
                            console.log(err);
                        } else {
                            req.session.error = user.username + ', Welcome to Crowd Jigsaw!';
                            return res.redirect('/home');
                        }
                    });
                } else {
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
router.route('/visitor').get(function(req, res) {
    if (req.session.user) {
        console.log(req.session.user.username);
        let selectStr = { username: req.session.user.username };
        let fields = { _id: 0, username: 1, avatar: 1, admin: 1 };
        UserModel.findOne(selectStr, fields, function(err, doc) {
            if (err) {
                console.log(err);
                req.session.user = null;
                req.session.error = null;
                return res.redirect('/visitor');
            } else {
                if (doc) {
                    return res.redirect('/home');
                }
            }
        });
    } else {
        UserModel.find({}, function(err, docs) {
            if (err) {
                console.log(err);
            } else {
                var index = docs.length;
                let operation = {
                    userid: index,
                    username: 'Visitor#' + index,
                    password: "",
                    last_online_time: util.getNowFormatDate(),
                    register_time: util.getNowFormatDate()
                };
                let user = { username: operation.username };
                UserModel.create(operation, function(err) {
                    if (err) {
                        console.log(err);
                    } else {
                        req.session.user = user
                        req.session.error = 'Welcome! ' + operation.username;
                        return res.redirect('/home');
                    }
                });
            }
        });
    }

});


// Register
router.route('/register').all(Logined).get(function(req, res) {
    res.render('register', { title: 'Register' });
}).post(function(req, res) {
    //从前端获取到的用户填写的数据
    if (req.body.password.replace(/[ ]/g, "").length == 0) {
        req.session.error = 'Passwords must not be empty!';
        return res.redirect('/register');
    }

    let passwd_enc = encrypt(req.body.password, SECRET);
    let passwd_sec_enc = encrypt(req.body.passwordSec, SECRET);

    let newUser = { username: req.body.username, password: passwd_enc, passwordSec: passwd_sec_enc };
    UserModel.find({}, function(err, docs) {
        if (err) {
            console.log(err);
        } else {
            var index = docs.length;
            //准备添加到数据库的数据（数组格式）
            let operation = {
                userid: index,
                username: newUser.username,
                password: newUser.password,
                last_online_time: util.getNowFormatDate(),
                register_time: util.getNowFormatDate()
            };
            //用于查询用户名是否存在的条件
            // let selectStr={username:newUser.username};
            UserModel.findOne({ username: newUser.username }, function(err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    if (!doc) {
                        if (operation.username.replace(/[ ]/g, "").length == 0) {
                            req.session.error = 'Username must not be empty!';
                            return res.redirect('/register');
                        }
                        if (newUser.password === newUser.passwordSec) {
                            UserModel.create(operation, function(err) {
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
router.route('/home').all(LoginFirst).get(function(req, res) {
    let selectStr = { username: req.session.user.username };
    let fields = { _id: 0, username: 1, avatar: 1, admin: 1 };
    UserModel.findOne(selectStr, fields, function(err, doc) {
        if (err) {
            console.log(err);
        } else {
            if (doc) {
                req.session.error = 'Welcome! ' + req.session.user.username;
                res.render('playground', { title: 'Home', username: doc.username, admin: doc.admin });
            }
        }
    });
});


// Round
router.route('/playground').all(LoginFirst).get(function(req, res) {
    let selectStr = { username: req.session.user.username };
    let fields = { _id: 0, username: 1, avatar: 1, admin: 1 };
    UserModel.findOne(selectStr, fields, function(err, doc) {
        if (err) {
            console.log(err);
        } else {
            if (doc) {
                res.render('playground', { title: 'Playground', username: doc.username, admin: doc.admin });
            }
        }
    });
});

router.route('/puzzle').all(LoginFirst).get(function(req, res) {
    let roundID = req.query.roundID;
    let condition = {
        round_id: parseInt(roundID)
    };
    var redis_key = 'round:' + condition.round_id;
    redis.get(redis_key, (err, data) => {
        if (data) {
            var round = JSON.parse(data);
            res.render('puzzle', {
                title: 'Puzzle',
                player_name: req.session.user.username,
                players_num: round.players_num,
                level: round.level,
                roundID: roundID,
                solved_players: round.solved_players,
                image: round.image,
                tileWidth: round.tileWidth,
                startTime: round.start_time,
                shape: round.shape,
                edge: round.edge,
                border: round.border,
                tilesPerRow: round.tilesPerRow,
                tilesPerColumn: round.tilesPerColumn,
                imageWidth: round.imageWidth,
                imageHeight: round.imageHeight,
                shapeArray: round.shapeArray
            });
        } else {
            RoundModel.findOne(condition, function(err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    var round = doc;
                    redis.set(redis_key, JSON.stringify(round), (err, data) => {});
                    res.render('puzzle', {
                        title: 'Puzzle',
                        player_name: req.session.user.username,
                        players_num: round.players_num,
                        level: round.level,
                        roundID: roundID,
                        solved_players: round.solved_players,
                        image: round.image,
                        tileWidth: round.tileWidth,
                        startTime: round.start_time,
                        shape: round.shape,
                        edge: round.edge,
                        border: round.border,
                        tilesPerRow: round.tilesPerRow,
                        tilesPerColumn: round.tilesPerColumn,
                        imageWidth: round.imageWidth,
                        imageHeight: round.imageHeight,
                        shapeArray: round.shapeArray
                    });
                }
            });
        }
    });
});


// Reset Password
router.route('/reset').get(function(req, res) {
    res.render('reset', { title: 'Reset Password' });
}).post(function(req, res) {
    if (req.body.username == null || req.body.username == undefined || req.body.username == '') {
        req.session.error = "Please input username first!";
        return res.redirect('/reset');
    } else {
        let user = { username: req.body.username };
        let selectStr = { username: user.username };

        UserModel.findOne(selectStr, function(err, doc) {
            if (err) {
                console.log(err);
            } else {
                if (doc) {
                    let whereStr = { username: req.body.username };
                    let update = { $set: { password: encrypt(whereStr.username, SECRET) } };
                    UserModel.update(whereStr, update, function(err) {
                        if (err) {
                            console.log(err);
                        } else {
                            req.session.error = 'Username: ' + whereStr.username + '; Password: ' + whereStr.username;
                            return res.redirect('/login');
                        }
                    });
                } else {
                    req.session.error = 'Playername does not exist!';
                    return res.redirect('/register');
                }
            }
        });
    }
});

// Account Settings
router.route('/settings').all(LoginFirst).get(function(req, res) {
    req.session.error = 'Change Password Here!';
    res.render('settings', { title: 'Player Settings', username: req.session.user.username });
}).post(function(req, res) {
    if (req.body.new_password != req.body.new_passwordSec) {
        req.session.error = 'Passwords do not agree with each other!';
        return res.redirect('/settings');
    } else {
        // Change the password
        let condition = {
            username: req.session.user.username
        };

        UserModel.findOne(condition, function(err, doc) {
            if (err) {
                console.log(err);
            } else {
                if (doc.password === encrypt(req.body.old_password, SECRET)) {
                    let operation = {
                        $set: {
                            password: encrypt(req.body.new_password, SECRET),
                        }
                    };
                    UserModel.update(condition, operation, function(err) {
                        if (err) {
                            console.log(err);
                        } else {
                            req.session.error = 'Password successfully updated!';
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

// Get the rank of this round
router.route('/roundrank/:round_id').all(LoginFirst).get(function(req, res) {
    let condition = { "records.round_id": req.params.round_id };
    let fields = { _id: 0, username: 1, avatar: 1, records: 1 };
    RoundModel.findOne({ round_id: req.params.round_id }, function(err, doc) {
        if (err) {
            console.log(err);
        } else {
            var round = doc;
            var roundContribution = round.contribution;
            var puzzle_links = 2 * round.tilesPerColumn * round.tilesPerRow - round.tilesPerColumn - round.tilesPerRow;
            UserModel.find(condition, fields, function(err, docs) {
                if (err) {
                    console.log(err);
                } else {
                    if (docs) {
                        let finished = new Array();
                        let unfinished = new Array();
                        for (let d of docs) {
                            for (let r of d.records) {
                                if (r.round_id == req.params.round_id && r.start_time != "-1") {
                                    let hintPercent = 0;
                                    let correctPercent = 0;
                                    let finishPercent = 0;
                                    if (r.hinted_links != -1 && r.total_links != -1 && r.total_links > 0 && r.hinted_links > 0) {
                                        hintPercent = r.hinted_links / r.total_links * 100;
                                    }
                                    if (r.total_hints > 0 && r.correct_hints != -1 && hintPercent > 0) {
                                        correctPercent = r.correct_hints / r.total_hints * 100;
                                    }
                                    if (r.total_links > 0 && r.correct_links != -1) {
                                        finishPercent = (r.correct_links / 2) / puzzle_links * 100;
                                    }
                                    let contribution = 0;
                                    if (roundContribution && roundContribution[d.username]) {
                                        contribution = roundContribution[d.username] * 100;
                                    }
                                    if (r.end_time != "-1") {
                                        finished.push({
                                            "playername": d.username,
                                            "avatar": d.avatar,
                                            "time": r.time,
                                            "steps": r.steps,
                                            "contribution": contribution.toFixed(3),
                                            "hintPercent": hintPercent.toFixed(3),
                                            "finishPercent": finishPercent.toFixed(3),
                                            "correctPercent": correctPercent.toFixed(3),
                                            "rating": r.rating
                                        });
                                    } else {
                                        unfinished.push({
                                            "playername": d.username,
                                            "avatar": d.avatar,
                                            "time": r.time,
                                            "steps": r.steps,
                                            "contribution": contribution.toFixed(3),
                                            "hintPercent": hintPercent.toFixed(3),
                                            "finishPercent": finishPercent.toFixed(3),
                                            "correctPercent": correctPercent.toFixed(3),
                                            "rating": r.rating
                                        });
                                    }
                                }
                            }
                        }
                        // sort the players
                        finished = finished.sort(util.ascending("time"));
                        unfinished = unfinished.sort(util.descending("contribution"));
                        res.render('roundrank', {
                            title: 'Round Rank',
                            Finished: finished,
                            Unfinished: unfinished,
                            username: req.session.user.username,
                            round_id: req.params.round_id
                        });
                    }
                }
            });
        }
    });
});

// Rank
router.route('/rank').all(LoginFirst).get(function(req, res) {
    req.session.error = 'Players Rank!';
    let fields = { username: 1, records: 1, _id: 0 }
        // Rank all the users according to the sum contribution
    UserModel.find({}, function(err, docs) {
        if (err) {
            console.log(err);
        } else {
            if (docs) {
                let temp = docs;
                for (let t of temp) {
                    t.credits = 0;
                    t.total_steps = 0;
                    for (let r of t.records) {
                        if (r.end_time != "-1") {
                            t.total_steps += parseInt(r.steps);
                            t.credits += r.contribution;
                        }
                    }
                    t.credits = parseFloat(t.credits).toFixed(3);
                }
                temp = temp.sort(util.descending("credits"));
                res.render('rank', { title: 'Ranks', Allusers: temp, username: req.session.user.username });
            }
        }
    });
});


// Personal Records
router.route('/records').all(LoginFirst).get(function(req, res) {
    req.session.error = 'See Your Records!';
    let condition = {
        username: req.session.user.username
    };

    UserModel.findOne(condition, { _id: 0, records: 1 }, function(err, doc) {
        if (err) {
            // res.render('records', { title: 'Personal Records' });
            console.log(err);
        } else {
            let results = new Array();
            // or use populate()
            for (let r of doc.records) {
                if (r.start_time != "-1") {
                    results.push(r);
                }
            }
            res.render('records', { title: 'Ranks', username: req.session.user.username, Allrecords: results });
        }
    });
});

// Help page
router.route('/help').all(LoginFirst).get(function(req, res) {
    // TODO    
    req.session.error = 'Get into Trouble?';
    res.render('help', { title: 'Help', username: "req.session.user.username" });
});

// Video demos
router.route('/demos').get(function(req, res) {
    res.render('demos', { title: 'Video Demos', username: '' });
});



// Log out
router.get('/logout', function(req, res) {
    req.session.user = null;
    req.session.error = null;
    return res.redirect('/login');
});

function Logined(req, res, next) {
    if (req.session.user) {
        req.session.error = 'Welcome back!';
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
router.route('/statistics').all(LoginFirst).get(function(req, res) {
    res.render('statistics', { title: 'Statistics', username: req.session.user.username });
});
// router.route('/award').all(LoginFirst).get(function (req, res) {
//     res.render('award', {title: 'Award',username: req.session.user.username});
// });

router.route('/award/:round_id').all(LoginFirst).get(function(req, res) {
    var redis_key = 'round:' + req.params.round_id;
    redis.get(redis_key, function(err, data) {
        if (data) {
            var round = JSON.parse(data);
            redis_key = 'round:' + req.params.round_id + ':scoreboard';
            redis.zrevrange(redis_key, 0, -1, 'WITHSCORES', function(err, scoreboard) {
                if (scoreboard) {
                    //console.log(scoreboard);
                    var defeat_num = 0;
                    var player1 = '';
                    if (scoreboard.length > 0 && parseFloat(scoreboard[1]) >= 100) {
                        player1 = scoreboard[0];
                        if (req.session.user.username == player1) {
                            defeat_num = round.players_num - 1;
                        }
                    }
                    var player2 = '';
                    if (scoreboard.length > 2 && parseFloat(scoreboard[3]) >= 100) {
                        player2 = scoreboard[2];
                        if (req.session.user.username == player2) {
                            defeat_num = round.players_num - 2;
                        }
                    }
                    var player3 = '';
                    if (scoreboard.length > 4 && parseFloat(scoreboard[5]) >= 100) {
                        player3 = scoreboard[4];
                        if (req.session.user.username == player3) {
                            defeat_num = round.players_num - 3;
                        }
                    }
                    for (var i = 6; i < scoreboard.length; i += 2) {
                        if (req.session.user.username == scoreboard[i]) {
                            defeat_num = round.players_num - 1 - i / 2;
                        }
                    }
                    res.render('award', {
                        title: 'Award',
                        player1: player1,
                        player2: player2,
                        player3: player3,
                        defeat_num: defeat_num,
                        username: req.session.user.username,
                        round_id: req.params.round_id
                    });
                }
            });
        }
    });
});

module.exports = router;