'use strict'
var express = require('express');
var router = express.Router();
var RoundModel = require('../models/round').Round;
var UserModel = require('../models/user').User;
var ActionModel = require('../models/action').Action;
var util = require('./util.js');
var dev = require('../config/dev');
var images = require("images");
var PythonShell = require('python-shell');

const redis = require('redis').createClient();

function getRoundFinishTime(startTime) {
    let finishTime = Math.floor(((new Date()).getTime() - startTime) / 1000);
    let hours = Math.floor(finishTime / 3600);
    let minutes = Math.floor((finishTime - hours * 3600) / 60);
    let seconds = finishTime - hours * 3600 - minutes * 60;
    if (hours >= 0 && hours <= 9) {
        hours = '0' + hours;
    }
    if (minutes >= 0 && minutes <= 9) {
        minutes = '0' + minutes;
    }
    if (seconds >= 0 && seconds <= 9) {
        seconds = '0' + seconds;
    }
    return hours + ":" + minutes + ":" + seconds;
}

function createRecord(player_name, round_id, join_time) {
    let condition = {
        username: player_name
    };
    let operation = {
        $push: {
            records: {
                round_id: round_id,
                join_time: join_time
            }
        }
    };
    UserModel.findOneAndUpdate(condition, operation, function (err) {
        if (err) {
            console.log(err);
        }
    });
}

function LoginFirst(req, res, next) {
    if (!req.session.user) {
        req.session.error = 'Please Login First!';
        return res.redirect('/login');
    }
    next();
}

function isCreator(req, res, next) {
    RoundModel.findOne({
        round_id: req.params.round_id
    }, {
        _id: 0,
        creator: 1
    }, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            if (doc) {
                if (!req.session.user) {
                    req.session.error = 'Please Login First!';
                    return res.redirect('/login');
                }
                if (doc.creator != req.session.user.username) {
                    req.session.error = "You are not the Boss!";
                }
                next();
            }
        }
    });
}

function startGA(round_id){
    var http = require('http');  
  
    var qs = require('querystring');  
      
    var data = {  
        roundID: round_id,  
        dataServer: '162.105.89.88'
    };//这是需要提交的数据  
      
      
    var content = qs.stringify(data);  
      
    var options = {  
        hostname: dev.GA_server,  
        path: '/ga?' + content,  
        method: 'GET'  
    };  
      
    var req = http.request(options, function (res) {  
        console.log('STATUS: ' + res.statusCode);  
        console.log('HEADERS: ' + JSON.stringify(res.headers));  
        res.setEncoding('utf8');  
        res.on('data', function (chunk) {  
            console.log('BODY: ' + chunk);  
        });  
    });  
      
    req.on('error', function (e) {  
        console.log('problem with request: ' + e.message);  
    });  
      
    req.end();  
}

module.exports = function (io) {

    io.on('connection', function (socket) {
        /**
         * Create a new round
         */
        socket.on('newRound', function (data) {
            RoundModel.count({}, function (err, docs_size) {
                if (err) {
                    console.log(err);
                } else {
                    let index = docs_size;
                    let TIME = util.getNowFormatDate();
                    let imageSrc = data.imageURL;
                    let image = images('public/' + imageSrc);
                    let size = image.size();
                    let imageWidth = size.width;
                    let imageHeight = size.height;
                    let tileWidth = 64;
                    let tilesPerRow = Math.floor(imageWidth / tileWidth);
                    let tilesPerColumn = Math.floor(imageHeight / tileWidth);
                    let shapeArray = util.getRandomShapes(tilesPerRow, tilesPerColumn, data.shape, data.edge);
                    let operation = {
                        round_id: index,
                        creator: data.username,
                        image: imageSrc,
                        level: data.level,
                        shape: data.shape,
                        edge: data.edge,
                        border: data.border,
                        create_time: TIME,
                        players_num: data.players_num,
                        players: [{
                            player_name: data.username,
                            join_time: TIME
                        }],
                        imageWidth: imageWidth,
                        imageHeight: imageHeight,
                        tileWidth: tileWidth,
                        tilesPerRow: tilesPerRow,
                        tilesPerColumn: tilesPerColumn,
                        tile_num: tilesPerRow * tilesPerColumn,
                        row_num: tilesPerRow,
                        shapeArray: shapeArray
                    };

                    if (data.players_num == 1) {
                        operation.players = [{
                            player_name: data.username,
                            join_time: TIME
                        }]
                    }

                    createRecord(data.username, operation.round_id, TIME);

                    RoundModel.create(operation, function (err, doc) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(data.username + ' creates Round' + index);
                            io.sockets.emit('roundChanged', {
                                round: doc,
                                username: data.username,
                                round_id: doc.round_id,
                                action: "create",
                                title: "CreateRound",
                                msg: 'You just create and join round' + doc.round_id
                            });
                            let redis_key = 'round:' + doc.round_id;
                            redis.set(redis_key, JSON.stringify(doc));
                        }
                    });
                }
            });
        });

        socket.on('joinRound', function (data) {
            let condition = {
                round_id: data.round_id
            };
            // check if joinable
            RoundModel.findOne(condition, function (err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    if (doc) {
                        if (doc.players.length < doc.players_num) {
                            let isIn = doc.players.some(function (p) {
                                return (p.player_name == data.username);
                            });
                            let TIME = util.getNowFormatDate();
                            if (!isIn) {
                                let operation = {
                                    $addToSet: { //if exists, give up add
                                        players: {
                                            player_name: data.username,
                                            join_time: TIME
                                        }
                                    }
                                };
                                RoundModel.update(condition, operation, function (err, doc) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        RoundModel.findOne(condition, function (err, doc) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                io.sockets.emit('roundChanged', {
                                                    round: doc,
                                                    username: data.username,
                                                    round_id: data.round_id,
                                                    action: "join",
                                                    title: "JoinRound",
                                                    msg: 'You just join round' + data.round_id
                                                });
                                                let redis_key = 'round:' + doc.round_id;
                                                redis.set(redis_key, JSON.stringify(doc));
                                            }
                                        });
                                        console.log(data.username + ' joins Round' + condition.round_id);
                                        createRecord(data.username, data.round_id, TIME);
                                    }
                                });

                            }
                        }
                    }
                }
            });
        });
        socket.on('iSolved', function (data) {
            console.log('!!!Round ' + data.round_id + ' is solves!');
            let finish_time = getRoundFinishTime(data.startTime);
            let operation = {
                $set: {
                    "winner": data.player_name,
                    "solved_players": 1,
                    "winner_time": finish_time,
                    "winner_steps": data.steps,
                    "total_links": data.totalLinks,
                    "hinted_links": data.hintedLinks,
                    "total_hints": data.totalHintsNum,
                    "correct_hints": data.correctHintsNum
                }
            };
            RoundModel.findOne({
                    round_id: data.round_id
                },
                function (err, doc) {
                    if (err) {
                        console.log(err);
                    } else {
                        if (doc) {
                            if (doc.solved_players == 0) {
                                // only remember the first winner of the round
                                RoundModel.update({
                                    round_id: data.round_id
                                }, operation, function (err) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    else{
                                        socket.broadcast.emit('forceLeave', {
                                            round_id: data.round_id
                                        });
                                    }
                                });
                            } else {
                                var solved_players = doc.solved_players;
                                RoundModel.update({
                                    round_id: data.round_id
                                }, {
                                    "solved_players": solved_players + 1
                                }, function (err) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        socket.broadcast.emit('forceLeave', {
                                            round_id: data.round_id
                                        });
                                    }
                                });
                            }
                            doc.solved_players += 1;
                            let redis_key = 'round:' + data.round_id;
                            redis.set(redis_key, JSON.stringify(doc));

                            let contri = 0;
                            if (doc.contribution && doc.contribution.hasOwnProperty(data.player_name)) {
                                contri = doc.contribution[data.player_name];
                            }
                            let TIME = util.getNowFormatDate();
                            operation = {
                                $set: {
                                    "records.$.end_time": TIME,
                                    "records.$.steps": data.steps,
                                    "records.$.time": finish_time,
                                    "records.$.contribution": contri.toFixed(3),
                                    "records.$.total_links": data.totalLinks,
                                    "records.$.hinted_links": data.hintedLinks,
                                    "records.$.correct_links": data.correctLinks,
                                    "records.$.total_hints": data.totalHintsNum,
                                    "records.$.correct_hints": data.correctHintsNum
                                }
                            };

                            let finishTime = Math.floor(((new Date()).getTime() - data.startTime) / 1000);
                            let puzzle_links = 2 * doc.tilesPerColumn * doc.tilesPerRow - doc.tilesPerColumn - doc.tilesPerRow;
                            let finishPercent = (data.correctLinks / 2) / puzzle_links * 100;
                            let score = parseFloat(finishPercent.toFixed(3));
                            score += parseFloat(3600 / finishTime);

                            let condition = {
                                username: data.player_name,
                                "records.round_id": data.round_id
                            };

                            UserModel.update(condition, operation, function (err, doc) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log(data.player_name + ' saves his record: ' + contri.toFixed(3));
                                }
                            });

                            socket.broadcast.emit('someoneSolved', data);
                        }
                    }
                });
        });
        socket.on('saveGame', function (data) {
            var save_game = {
                round_id: data.round_id,
                steps: data.steps,
                realSteps: data.realSteps,
                startTime: data.startTime,
                maxSubGraphSize: data.maxSubGraphSize,
                tiles: data.tiles,
                tileHintedLinks: data.tileHintedLinks,
                totalHintsNum: data.totalHintsNum,
                correctHintsNum: data.correctHintsNum
            };

            let redis_key = 'user:' + data.player_name + ':savegame';
            redis.set(redis_key, JSON.stringify(save_game), function (err, response) {
                if (err) {
                    console.log(err);
                    socket.emit('gameSaved', {
                        err: err
                    });
                } else {
                    socket.emit('gameSaved', {
                        success: true,
                        round_id: data.round_id,
                        player_name: data.player_name
                    });
                }
            });
        });
        /**
         * Load a game by one user
         */
        socket.on('loadGame', function (data) {
            let redis_key = 'user:' + data.username + ':savegame';
            redis.get(redis_key, function (err, save_game) {
                //console.log(save_game);
                io.sockets.emit('loadGameSuccess', {
                    username: data.username,
                    gameData: JSON.parse(save_game)
                });
            });
        });

        var round_starting = {};
        socket.on('startRound', function (data) {
            let condition = {
                round_id: data.round_id,
            };
            // check if the players are enough
            // findOneAndUpdate
            RoundModel.findOne(condition, function (err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    if (doc) {
                        if (doc.start_time != '-1') {
                            return;
                        }
                        if(data.round_id in round_starting && round_starting[data.round_id]){
                            return;
                        }
                        round_starting[data.round_id] = true;

                        let TIME = util.getNowFormatDate();
                        // set start_time for all players
                        for (let p of doc.players) {
                            let operation = {
                                $set: {
                                    "records.$.start_time": TIME
                                }
                            };
                            UserModel.update({
                                username: p.player_name,
                                "records.round_id": data.round_id
                            }, operation, function (err) {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        }
                        // set start time for round
                        let operation = {
                            $set: {
                                start_time: TIME,
                                players_num: doc.players.length
                            }
                        };
                        RoundModel.update(condition, operation, function (err, doc) {
                            if (err) {
                                console.log(err);
                            } else {
                                RoundModel.findOne(condition, function (err, doc) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        io.sockets.emit('roundChanged', {
                                            round: doc,
                                            username: data.username,
                                            round_id: data.round_id,
                                            action: "start",
                                            title: "StartRound",
                                            msg: 'You just start round' + data.round_id
                                        });
                                        let redis_key = 'round:' + doc.round_id;
                                        redis.set(redis_key, JSON.stringify(doc));
                                        if(doc.players_num > 1){
                                            startGA(data.round_id);
                                        }
                                        round_starting[data.round_id] = false;
                                    }
                                });
                                console.log(data.username + ' starts Round' + data.round_id);
                            }
                        });
                    }
                }
            });
        });

        socket.on('quitRound', function (data) {
            let condition = {
                round_id: data.round_id
            };
            RoundModel.findOne(condition, function (err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    if (doc) {
                        let isIn = doc.players.some(function (p) {
                            return (p.player_name == data.username);
                        });
                        if (isIn) {
                            if (doc.players.length == 1) { // the last player
                                let operation = {
                                    $pull: {
                                        players: {
                                            player_name: data.username
                                        }
                                    },
                                    end_time: util.getNowFormatDate()
                                };
                                RoundModel.update(condition, operation, function (err, doc) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        RoundModel.findOne(condition, function (err, doc) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                io.sockets.emit('roundChanged', {
                                                    round: doc,
                                                    username: data.username,
                                                    round_id: data.round_id,
                                                    action: "quit",
                                                    title: "StopRound",
                                                    msg: 'You just stop round' + data.round_id
                                                });
                                                let redis_key = 'round:' + doc.round_id;
                                                redis.set(redis_key, JSON.stringify(doc));
                                            }
                                        });
                                        console.log(data.username + ' stops Round' + data.round_id);
                                    }
                                });
                            } else { // online>=2
                                let operation = {
                                    $pull: { //if exists, give up add
                                        players: {
                                            player_name: data.username
                                        }
                                    }
                                };
                                RoundModel.update(condition, operation, function (err, doc) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        RoundModel.findOne(condition, function (err, doc) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                io.sockets.emit('roundChanged', {
                                                    round: doc,
                                                    username: data.username,
                                                    round_id: data.round_id,
                                                    action: "quit",
                                                    title: "QuitRound",
                                                    msg: 'You just quit round' + data.round_id
                                                });
                                                let redis_key = 'round:' + doc.round_id;
                                                redis.set(redis_key, JSON.stringify(doc));
                                            }
                                        });
                                        console.log(data.username + ' quits Round' + data.round_id);
                                    }
                                });
                            }
                        }
                    }
                }
            });
        });

        socket.on('saveRecord', function (data) {
            let operation = {};
            let contri = 0;
            let rating = data.rating;
            RoundModel.findOne({
                round_id: data.round_id
            }, function (err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    if (doc) {
                        if (doc.contribution && doc.contribution.hasOwnProperty(data.player_name)) {
                            contri = doc.contribution[data.player_name];
                        }
                        if (data.finished) {
                            let TIME = util.getNowFormatDate();
                            operation = {
                                $set: {
                                    "records.$.rating": rating
                                }
                            };
                        } else {
                            operation = {
                                $set: {
                                    "records.$.end_time": "-1",
                                    "records.$.steps": data.steps,
                                    "records.$.time": getRoundFinishTime(data.startTime),
                                    "records.$.contribution": contri.toFixed(3),
                                    "records.$.total_links": data.totalLinks,
                                    "records.$.hinted_links": data.hintedLinks,
                                    "records.$.correct_links": data.correctLinks,
                                    "records.$.total_hints": data.totalHintsNum,
                                    "records.$.correct_hints": data.correctHintsNum,
                                    "records.$.rating": rating
                                }
                            };

                            let puzzle_links = 2 * doc.tilesPerColumn * doc.tilesPerRow - doc.tilesPerColumn - doc.tilesPerRow;
                            let finishPercent = (data.correctLinks / 2) / puzzle_links * 100;
                            let score = parseFloat(finishPercent.toFixed(3));
                        }

                        let condition = {
                            username: data.player_name,
                            "records.round_id": data.round_id
                        };

                        UserModel.update(condition, operation, function (err, doc) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log(data.player_name + ' saves his record: ' + contri.toFixed(3));
                            }
                        });
                    }
                }
            });
        });
    });

    /**
     * Get all rounds
     */
    router.route('/').all(LoginFirst).get(function (req, res, next) {
        RoundModel.find({}, function (err, docs) {
            res.send(JSON.stringify(docs));
        });
    });

    /**
     * Get all Joinable rounds
     */
    router.route('/getJoinableRounds').all(LoginFirst).get(function (req, res, next) {
        let condition = {
            end_time: "-1"
        };
        RoundModel.find(condition, function (err, docs) {
            if (err) {
                console.log(err);
            } else {
                // let temp=new Array();
                // for(let d of docs){
                //     if(d.players.length < d.player_name){
                //         temp.push(d);
                //     }
                // }
                res.send(JSON.stringify(docs));
            }
        });
    });

    /**
     * Get the round contribution rank
     */
    router.route('/getRoundRank/:round_id').all(LoginFirst).get(function (req, res, next) {
        RoundModel.findOne({
            round_id: req.params.round_id
        }, {
            _id: 0,
            players: 1
        }, {}, function (err, doc) {
            if (err) {
                console.log(err);
            } else {
                if (doc) {
                    let rankedPlayers = new Array();
                    let temp = doc.players;
                    temp = temp.sort(util.descending("contribution"));
                    for (let i = 0; i < temp.length; i++) {
                        let t = temp[i];
                        rankedPlayers.push({
                            "rank": i + 1,
                            "player_name": t.player_name,
                            "contribution": t.contribution.toFixed(3)
                            //Math.round(t.contribution*1000)/1000
                        });
                    }
                    // res.render('roundrank', { title: 'Round Rank', AllPlayers: JSON.stringify(rankedPlayers), username: req.session.user.username });
                    res.send({
                        AllPlayers: rankedPlayers
                    });
                }
            }
        });
    });

    /**
     * Get round details with roundid
     */
    router.route('/getRoundDetails/:round_id').all(LoginFirst).get(function (req, res, next) {
        let condition = {
            round_id: req.params.round_id
        };
        let fields = {
            _id: 0,
            creator: 1,
            // image: 1,
            shape: 1,
            level: 1,
            edge: 1,
            border: 1,
            tile_num: 1,
            winner_time: 1
        };
        RoundModel.findOne(condition, fields, function (err, doc) {
            if (err) {
                console.log(err);
            } else {
                res.send(doc);
            }
        });
    });


    /**
     * Get hint ration&precision in a dirty way
     */
    function getHRHP(round_id) {
        return new Promise((resolve, reject) => {
            RoundModel.findOne({
                round_id: round_id
            }, function (err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    if (doc) {
                        if (doc.winner) {
                            UserModel.findOne({
                                username: doc.winner
                            }, {
                                _id: 0,
                                records: 1
                            }, function (err, d) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    if (d) {
                                        for (let r of d.records) {
                                            if (r.round_id == round_id) {
                                                let hint_ratio = 0;
                                                let hint_precision = 0;
                                                if (r.total_links > 0 && r.total_hints > 0) {
                                                    hint_ratio = r.hinted_links / r.total_links;
                                                    hint_precision = r.correct_hints / r.total_hints;
                                                }
                                                resolve({
                                                    "hint_ratio": hint_ratio,
                                                    "hint_precision": hint_precision
                                                });
                                            }
                                        }
                                    }
                                }
                            });
                        } else {
                            console.log("Winner Empty " + round_id);
                            resolve({
                                "hint_ratio": 0,
                                "hint_precision": 0
                            });
                        }
                    }
                }
            });
        });
    }
    /**
     * Get the data required by statistics
     */
    function getWinnerData(round_id) {
        return new Promise((resolve, reject) => {
            RoundModel.findOne({
                round_id: round_id
            }, function (err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    if (doc) {
                        if (doc.winner_time != "-1" && doc.winner_steps != -1) {
                            let time = doc.winner_time.split(":");
                            let h = parseInt(time[0]);
                            let m = parseInt(time[1]);
                            let s = parseInt(time[2]);
                            resolve({
                                "time": h * 3600 + m * 60 + s,
                                "steps": doc.winner_steps
                            });
                        } else {
                            console.log("Empty: " + round_id);
                        }
                    }
                }
            });
        });
    }

    router.route('/getStatistics').get(async function (req, res, next) {
        // ids[0][0]=1--4 ids[0][1]
        // ids[x][y]=x+1--y+4
        let ids = [
            // 1 participant
            [
                [242, 243, 301, 302, 303, 272, 279, 286], // 4x4
                [248, 250, 304, 306, 307, 273, 280, 287], // 5x5
                [308, 309, 310, 274, 281, 288], // 6x6             
                [311, 312, 313, 275, 282, 289], // 7x7
                [314, 315, 316, 276, 283, 290], // 8x8
                [317, 318, 319, 277, 284, 291], // 9x9
                [305, 320, 321, 278, 285, 292, 346] // 10x10
            ],
            // 2 participants
            [
                [240, 331],
                [332, 334, 525],
                [247, 333, 498],
                [335],
                [356],
                [357, 527],
                [347, 481, 482]
            ],
            // 3 participants
            [
                [337, 339, 412, 421],
                [338, 340],
                [245, 246, 522],
                [336, 341, 432, 523],
                [342],
                [344, 524],
                [440, 460]
            ],
            // 4 participants
            [
                [348],
                [349, 422],
                [350, 424],
                [351],
                [352],
                [354, 426],
                [355, 488, 489]
            ],
            // 5 participants
            [
                [392],
                [405],
                [406, 441],
                [407],
                [408, 450, 451],
                [434, 459],
                [442, 487]
            ],
            // 6 participants
            [
                [386],
                [388],
                [389, 390],
                [393],
                [395],
                [398],
                [403, 486]
            ],
            // 7 participants
            [
                [387, 391],
                [394],
                [396],
                [397],
                [399, 438],
                [436],
                [439, 456, 252]
            ],
            // 8 participants
            [
                [400],
                [401, 446],
                [402],
                [404],
                [431],
                [435],
                [443, 485]
            ],
            // 9 participants
            [
                [409, 483],
                [410, 420],
                [411, 484],
                [413],
                [423],
                [425, 477],
                [427, 480]
            ],
            // 10 participants
            [
                [261, 265, 367, 373, 375, 419, 471],
                [253, 254, 259, 267, 372, 376, 472],
                [255, 256, 366, 371, 377, 475],
                [257, 258, 264, 371, 378, 474],
                [262, 263, 365, 370, 379, 476],
                [266, 268, 363, 369, 380, 478],
                [252, 361, 368, 381, 427, 429, 452, 479]
            ]
        ];

        let results = new Array();

        for (let gs = 0; gs < ids.length; gs++) {
            for (let ps = 0; ps < ids[gs].length; ps++) {
                let average_time = 0;
                let average_steps = 0;
                let average_hint_ratio = 0;
                let average_hint_precision = 0;
                for (let i = 0; i < ids[gs][ps].length; i++) {
                    let round_id = ids[gs][ps][i];
                    let data = await getWinnerData(round_id);
                    average_time += data.time;
                    average_steps += data.steps;
                    data = await getHRHP(round_id);
                    average_hint_ratio += data.hint_ratio;
                    average_hint_precision += data.hint_precision;
                }
                average_time /= ids[gs][ps].length;
                average_steps /= ids[gs][ps].length;
                average_hint_ratio /= ids[gs][ps].length;
                average_hint_precision /= ids[gs][ps].length;
                results.push({
                    "group_size": gs + 1,
                    "puzzle_size": ps + 4,
                    "average_time": average_time.toFixed(3),
                    "average_steps": average_steps.toFixed(3),
                    "average_hint_ratio": average_hint_ratio.toFixed(5),
                    "average_hint_precision": average_hint_precision.toFixed(5)
                });
            }
        }
        res.send(results);
    });

    return router;
};