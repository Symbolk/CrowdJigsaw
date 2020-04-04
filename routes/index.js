'use strict'

var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
var UserModel = require('../models/user').User;
var RoundModel = require('../models/round').Round;
var RecordModel = require('../models/record').Record;
var dev = require('../config/dev');
var crypto = require('crypto');
var util = require('./util.js');
var PythonShell = require('python-shell');
/**请求其他页面**/
const request = require('request');

const redis = require('../redis');
const Promise = require('bluebird');

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
router.route('/').all(LoginFirst).all(Logined).get(async function (req, res, next) {
    console.log("system get");
    if(!dev.multiPlayer){
	   return res.redirect('/visitor');
       console.log("redirect visitor");
    }
    // req.session.error = 'Welcome to Crowd Jigsaw Puzzle!';
    // res.render('index', {
    //     title: 'Crowd Jigsaw Puzzle'
    // });
    console.log("render index");
});

// Login
router.route('/login').all(Logined).get(function (req, res) {
    if(!dev.multiPlayer){
       return res.redirect('/visitor');
    }
    res.render('login', { title: 'Login' });
});

/**
 * Log in as a visitor
 */
router.route('/visitor').get(function (req, res) {
    if (req.session.user) {
        console.log(req.session.user.username);
        let selectStr = {
            username: req.session.user.username
        };
        let fields = {
            _id: 0,
            username: 1,
            avatar: 1,
            admin: 1
        };
        UserModel.findOne(selectStr, fields, function (err, doc) {
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
        UserModel.find(function (err, docs) {
            if (err) {
                console.log(err);
            } else {
                if (docs) {
                    let index = docs.length > 0 ? docs[docs.length-1].userid + 1: docs.length;
                    let operation = {
                        userid: index,
                        username: 'Visitor#' + index,
                        password: "",
                        last_online_time: util.getNowFormatDate(),
                        register_time: util.getNowFormatDate()
                    };
                    let user = {
                        username: operation.username
                    };
                    UserModel.create(operation, function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            req.session.user = user
                            req.session.error = 'Welcome! ' + operation.username;
                            return res.redirect('/home');
                        }
                    });
                }
            }
        });
    }
});


// 
router.route('/register').all(Logined).get(function (req, res) {
    res.render('register', {
        title: 'Register'
    });
}).post(function (req, res) {
    //从前端获取到的用户填写的数据
    if (req.body.password.replace(/[ ]/g, "").length == 0) {
        req.session.error = 'Passwords must not be empty!';
        return res.redirect('/register');
    }

    let passwd_enc = encrypt(req.body.password, SECRET);
    let passwd_sec_enc = encrypt(req.body.passwordSec, SECRET);

    let newUser = {
        username: req.body.username,
        password: passwd_enc,
        passwordSec: passwd_sec_enc
    };
    UserModel.find({}, function (err, docs) {
        if (err) {
            console.log(err);
        } else {
            if (docs) {
                let index = docs.length > 0 ? docs[docs.length-1].userid + 1: docs.length;
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
                UserModel.findOne({
                    username: newUser.username
                }, function (err, doc) {
                    if (err) {
                        console.log(err);
                    } else {
                        if (!doc) {
                            if (operation.username.replace(/[ ]/g, "").length == 0) {
                                req.session.error = 'Username must not be empty!';
                                return res.redirect('/register');
                            }
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
        }
    });
});


//Home 
router.route('/home').all(LoginFirst).get(function (req, res) {
    let selectStr = {
        username: req.session.user.username
    };
    let fields = {
        _id: 0,
        username: 1,
        avatar: 1,
        admin: 1,
        total_score: 1,
        round_attend: 1,
        after_class_score: 1,
    };
    UserModel.findOne(selectStr, fields, async function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            if (doc) {
                let final_user_score = await redis.getAsync('final_user_score');
                final_user_score = final_user_score? JSON.parse(final_user_score): [];
                let final_class_score = await redis.getAsync('final_class_score');
                final_class_score = final_class_score? JSON.parse(final_class_score): [];
                let final_show_flag = await redis.getAsync('final_show_flag');
                final_show_flag = final_show_flag? true: false;
                let ranking = final_user_score.length;
                let new_final_user_score = [];
                let score = 0;
                if (final_user_score.length > 0) {
                    for (let i = 0; i < final_user_score.length; i++) {
                        let u = final_user_score[i];
                        if (u.username[0] !== '1' || u.username.length != 10) {
                            continue;
                        }
                        if (i < 10) {
                            new_final_user_score.push(u);
                        }
                        if (u.username === doc.username || doc.username.search(/u.username/) >= 0) {
                            ranking = i + 1;
                            score = u.score;
                        }
                    }
                }
                req.session.error = 'Welcome! ' + req.session.user.username;
                res.render('playground', {
                    title: 'Home',
                    username: doc.username,
                    admin: doc.admin,
                    total_score: score || doc.total_score || 0,
                    round_attend: doc.round_attend || 0,
                    after_class_score: doc.after_class_score || 0,
                    multiPlayer: dev.multiPlayer,
                    multiPlayerServer: dev.multiPlayerServer,
                    singlePlayerServer: dev.singlePlayerServer,
                    normalPlayerCreateRound: dev.normalPlayerCreateRound,
                    final_class_score: final_class_score,
                    final_user_score: new_final_user_score,
                    final_show_flag: final_show_flag,
                    final_ranking: ranking,
                });
            }else{
                UserModel.find({}, function (err, docs) {
                    if (err) {
                        console.log(err);
                    } else {
                        if (docs) {
                            let index = docs.length > 0 ? docs[docs.length-1].userid + 1: docs.length;
                            //准备添加到数据库的数据（数组格式）
                            let operation = {
                                userid: index,
                                username: selectStr.username,
                                last_online_time: util.getNowFormatDate(),
                                register_time: util.getNowFormatDate()
                            };
                            UserModel.create(operation, async function (err) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    let final_user_score = await redis.getAsync('final_user_score');
                                    final_user_score = final_user_score? JSON.parse(final_user_score): [];
                                    let final_class_score = await redis.getAsync('final_class_score');
                                    final_class_score = final_class_score? JSON.parse(final_class_score): [];
                                    let final_show_flag = await redis.getAsync('final_show_flag');
                                    final_show_flag = final_show_flag? true: false;
                                    let ranking = final_user_score.length;
                                    let new_final_user_score = [];
                                    let score = 0;
                                    // req.session.error = 'Register success, you can login now!';
                                    // return res.redirect('/login');
                                    req.session.error = 'Welcome! ' + req.session.user.username;
                                    res.render('playground', {
                                        title: 'Home',
                                        username: selectStr.username,
                                        admin: false,
                                        total_score: 0,
                                        round_attend: 0,
                                        after_class_score: 0,
                                        multiPlayer: dev.multiPlayer,
                                        multiPlayerServer: dev.multiPlayerServer,
                                        singlePlayerServer: dev.singlePlayerServer,
                                        normalPlayerCreateRound: dev.normalPlayerCreateRound,
                                        final_class_score: final_class_score,
                                        final_user_score: new_final_user_score,
                                        final_show_flag: final_show_flag,
                                        final_ranking: ranking,
                                    });
                                }
                            });
                        }
                    }
                });
            }
        }
    });
});


router.route('/puzzle').all(LoginFirst).get(function (req, res) {
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
                official: round.official || false,
                forceLeaveEnable: round.forceLeaveEnable || false,
                hintDelay: round.hintDelay || false,
                algorithm: round.algorithm,
                tilesPerRow: round.tilesPerRow,
                tilesPerColumn: round.tilesPerColumn,
                imageWidth: round.imageWidth,
                imageHeight: round.imageHeight,
                shapeArray: round.shapeArray
            });
        } else {
            RoundModel.findOne(condition, function (err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    if (doc) {
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
                            official: round.official || false,
                            forceLeaveEnable: round.forceLeaveEnable || false,
                            hintDelay: round.hintDelay || false,
                            algorithm: round.algorithm,
                            tilesPerRow: round.tilesPerRow,
                            tilesPerColumn: round.tilesPerColumn,
                            imageWidth: round.imageWidth,
                            imageHeight: round.imageHeight,
                            shapeArray: round.shapeArray
                        });
                    }
                }
            });
        }
    });
});


var ga_started = new Array();
router.route('/ga').get(function (req, res) {
    let round_id = req.query.round_id;
    if (ga_started[round_id]) {
        res.send('GA algorithm for round ' + round_id + ' has already been started.');
        console.log('GA algorithm for round %d has already been started.', round_id);
        return;
    }
    let data_server = req.query.data_server;
    // run genetic algorithm
    res.send('start running python script of GA algorithm for round ' + round_id);
    console.log('start running python script of GA algorithm for round %d.', round_id);
    var path = require('path');
    var options = {
        mode: 'text',
        pythonPath: 'python3',
        pythonOptions: ['-u'], // get print results in real-time
        scriptPath: '/Users/weiyuhan/git/gaps/bin',
        args: ['--hide_detail', '--measure_weight',
            '--online', '--round_id', round_id,
            '--data_server', data_server
        ]
    };
    let pyshell = new PythonShell('gaps', options);
    pyshell.on('message', function (message) {
        // received a message sent from the Python script (a simple "print" statement)
        console.log(message);
    });
    // end the input stream and allow the process to exit
    pyshell.end(function (err,code,signal) {
        if (err){
            console.log(err);
        }
        ga_started[round_id] = false;
    });
});

// Reset Password
router.route('/reset').get(function (req, res) {
    res.render('reset', {
        title: 'Reset Password'
    });
}).post(function (req, res) {
    if (req.body.username == null || req.body.username == undefined || req.body.username == '') {
        req.session.error = "Please input username first!";
        return res.redirect('/reset');
    } else {
        let user = {
            username: req.body.username
        };
        let selectStr = {
            username: user.username
        };

        UserModel.findOne(selectStr, function (err, doc) {
            if (err) {
                console.log(err);
            } else {
                if (doc) {
                    let whereStr = {
                        username: req.body.username
                    };
                    let update = {
                        $set: {
                            password: encrypt(whereStr.username, SECRET)
                        }
                    };
                    UserModel.update(whereStr, update, function (err) {
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
router.route('/settings').all(LoginFirst).get(function (req, res) {
    req.session.error = 'Change Password Here!';
    res.render('settings', {
        title: 'Player Settings',
        username: req.session.user.username
    });
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
                if (doc) {
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
                                req.session.error = 'Password successfully updated!';
                                return res.redirect('/home');
                            }
                        });
                    } else {
                        req.session.error = 'The old password is wrong!';
                        return res.redirect('/settings');
                    }
                }
            }
        });
    }
});

// Get the rank of this round
router.route('/roundrank/:round_id').all(LoginFirst).get(async function (req, res) {
    let condition = {
        "round_id": req.params.round_id
    };
    RecordModel.find(condition, async function (err, records) {
        if (err) {
            console.log(err);
        } else if (records) {
            let redis_key = 'round:' + req.params.round_id;
            let round_json = await redis.getAsync(redis_key);
            if(!round_json) {
                RoundModel.findOne(condition, function(err, doc) {
                    if (err) {
                        console.log(err);
                    } else if (doc) {
                        redis.set(redis_key, JSON.stringify(doc));
                        res.json({msg: "try again"});
                    }
                });
                return;
            }
            let round = JSON.parse(round_json);
            //console.log(round, round.tilesPerColumn, round.tilesPerRow);
            let puzzle_links = 2 * round.tilesPerColumn * round.tilesPerRow - round.tilesPerColumn - round.tilesPerRow;
            let finished = new Array();
            let unfinished = new Array();
            for (let r of records) {
                let hintPercent = 0;
                let correctPercent = 0;
                let finishPercent = 0;
                if (r.hinted_steps != -1 && r.total_steps != -1 && r.total_steps > 0 && r.hinted_steps > 0) {
                    hintPercent = r.hinted_steps / r.total_steps * 100;
                }
                if (r.total_hints > 0 && r.correct_hints != -1 && hintPercent > 0) {
                    correctPercent = r.correct_hints / r.total_hints * 100;
                }
                if (r.total_links > 0 && r.correct_links != -1) {
                    finishPercent = (r.correct_links / 2) / puzzle_links * 100;
                }
                if (r.end_time != "-1") {
                    finished.push({
                        "playername": r.username,
                        "time": r.time,
                        "steps": r.steps,
                        "hintPercent": hintPercent.toFixed(3),
                        "finishPercent": finishPercent.toFixed(3),
                        "correctPercent": correctPercent.toFixed(3),
                        "rating": r.rating,
                        "score": r.score,
                        "create_correct_link": r.create_correct_link,
                        "remove_correct_link": r.remove_correct_link,
                        "create_wrong_link": r.create_wrong_link,
                        "remove_wrong_link": r.remove_wrong_link,
                        "remove_hinted_wrong_link": r.remove_hinted_wrong_link
                    });
                } else {
                    unfinished.push({
                        "playername": r.username,
                        "time": r.time,
                        "steps": r.steps,
                        "hintPercent": hintPercent.toFixed(3),
                        "finishPercent": finishPercent.toFixed(3),
                        "correctPercent": correctPercent.toFixed(3),
                        "rating": r.rating,
                        "score": r.score,
                        "create_correct_link": r.create_correct_link,
                        "remove_correct_link": r.remove_correct_link,
                        "create_wrong_link": r.create_wrong_link,
                        "remove_wrong_link": r.remove_wrong_link,
                        "remove_hinted_wrong_link": r.remove_hinted_wrong_link
                    });
                }
            }
            finished = finished.sort(util.ascending("time"));
            unfinished = unfinished.sort(util.descending("finishPercent"));
            res.render('roundrank', {
                title: 'Round Rank',
                endTime: finished && finished.length > 0? finished[0].time: 3600,
                Finished: finished,
                Unfinished: unfinished,
                username: req.session.user.username,
                round_id: req.params.round_id
            });
        }
    });
});

// Personal Records
router.route('/records').all(LoginFirst).get(function (req, res) {
    req.session.error = 'See Your Records!';
    let condition = {
        username: req.session.user.username
    };

    RecordModel.find(condition, function (err, records) {
        if (err) {
            console.log(err);
        } else {
            let resp = new Array();
            for (let r of records) {
                if (r.time != "-1") {
                    resp.push(r);
                }
            }
            let fields = {
                _id: 0,
                total_score: 1,
                round_attend: 1,
                after_class_score: 1,
            };
            UserModel.findOne(condition, fields, function (err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    if (doc) {
                        req.session.error = 'Welcome! ' + req.session.user.username;
                        res.render('records', {
                            title: 'Records',
                            username: req.session.user.username,
                            total_score: doc.total_score || 0,
                            round_attend: doc.round_attend || 0,
                            after_class_score: doc.after_class_score || 0,
                            Allrecords: resp
                        });
                    }
                }
            });
        }
    });
});

// Help page
router.route('/help').all(LoginFirst).get(function (req, res) {
    // TODO    
    req.session.error = 'Get into Trouble?';
    res.render('help', {
        title: 'Help',
        username: req.session.user.username
    });
});



// Log out
router.get('/logout', function (req, res) {
    req.session.user = null;
    req.session.error = null;
    //req.session.destroy();
    return res.redirect('http://passport.pintu.fun/logout?redirectUrl=test-gjm.pintu.fun');
});

function Logined(req, res, next) {
    console.log('session'+req.session.user);
    if (req.session.user) {
        req.session.error = 'Welcome back!';
        return res.redirect('/home');
    }
    //如果当前中间件没有终结请求-响应循环，则必须调用 next() 方法将控制权交给下一个中间件，否则请求就会挂起。
    next();
}

function LoginFirst(req, res, next) {
    if (!req.session.user) {
            /*
         * 如果 session 中没有用户信息，则需要去 passport 系统进行身份认证。这里区分两种情况：
         *
         * 1. 如果 url 中带有 token 信息，则去 passport 中认证 token 的有效性，如果有效则说明登录成功，建立 session 开始通话。
         * 2. 如果 url 中没有 token 信息，则取 passport 进行登录。如果登录成功，passport 会将浏览器重定向到此系统并在 url 上附带 token 信息。进行步骤 1。
         *
         * 因为 token 很容易伪造，所以需要去检验 token 的真伪，否则任何一个带有 token 的请求岂不是都可以通过认证。
         */
        let system = process.env.SERVER_NAME;
        console.log('no session');
        let token = req.query.token;
        if (!token) {
          console.log('no token and redirect');
          req.session.error = 'Please Login First!';
          res.redirect(`http://passport.pintu.fun/login?redirectUrl=${req.headers.host + req.originalUrl}`);      
        } else {
            console.log('have token');
          request(
            `http://passport.pintu.fun/check_token?token=${token}&t=${new Date().getTime()}`,
             function (error, response, data) {
              if (!error && response.statusCode === 200) {
                data = JSON.parse(data);
                if (data.error === 0) {
                  // TODO 这里的 userId 信息应该是经过加密的，加密算法要么内嵌，要么从 passport 获取。这里为了操作简单，直接使用明文。
                  let userName = data.username;
                  console.log('userName:'+userName);
                  if (!userName) {
                    res.redirect(`http://passport.pintu.fun/login?redirectUrl=${req.headers.host + req.originalUrl}`);
                    console.log('no userName redirect login');
                    return;
                  }
                  /*
                   * TODO
                   * 获取 userId 后，可以操作数据库获取用户的详细信息，用户名、权限等；这里也可以由 passport 直接返回 user 信息，主要看用户信息
                   * 的数据库如何部署。
                   * 为了方便，直接操作 userId，省略用户数据库操作。
                   */
                  console.log('no session system login success');
                  let condition = {
                      username: userName
                    };
                  req.session.user = condition;
                  req.session.error = userName + ', Welcome to Crowd Jigsaw!';
                  return res.redirect('/home');
                  //req.session.user = userId;
                  //res.render('/home');
                } else {
                  // token 验证失败，重新去 passport 登录。
                  res.redirect(`http://passport.pintu.fun/login?redirectUrl=${req.headers.host + req.originalUrl}`);
                  console.log('data error redirect login');
                }
              } else {
                res.redirect(`http://passport.pintu.fun/login?redirectUrl=${req.headers.host + req.originalUrl}`);
                console.log('error==1,登录失败');
              }
            });
        }
    }
    next();
}
router.route('/statistics').all(LoginFirst).get(function (req, res) {
    res.render('statistics', {
        title: 'Statistics',
        username: req.session.user.username
    });
});

// router.route('/award').all(LoginFirst).get(function (req, res) {
//     res.render('award', {title: 'Award',username: req.session.user.username});
// });

router.route('/award/:round_id').all(LoginFirst).get(function (req, res) {
    let round_key = 'round:' + req.params.round_id;
    let scoreboard_key = 'round:' + req.params.round_id + ':scoreboard';
    Promise.join(redis.getAsync(round_key),
        redis.zrevrangeAsync(scoreboard_key, 0, -1, 'WITHSCORES'))
    .then(function(results){
        let [round_json, scoreboard] = results;
        if(round_json && scoreboard){
            let round = JSON.parse(round_json);
            res.render('award', {
                title: 'Award',
                username: req.session.user.username,
                round_id: req.params.round_id,
                players_num: round.players_num,
                scoreboard: JSON.stringify(scoreboard)
            });
        }
    }).catch(function(err){
        if(err){
            console.log(err);
        }
    });
});

module.exports = router;
