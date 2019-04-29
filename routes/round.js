'use strict'
var express = require('express');
var router = express.Router();
var RoundModel = require('../models/round').Round;
var UserModel = require('../models/user').User;
var ActionModel = require('../models/action').Action;
var RecordModel = require('../models/record').Record;
var util = require('./util.js');
var dev = require('../config/dev');
var images = require("images");
const redis = require('redis').createClient();
const Promise = require('bluebird');

async function saveScore(round_id) {
    let redis_key = 'round:' + round_id + ':scoreboard';
    let results = await Promise.join(
        redis.zrevrangeAsync(redis_key, 0, -1, 'WITHSCORES'),
        redis.zrevrangeAsync(redis_key + ':create_correct_link', 0, -1, 'WITHSCORES'),
        redis.zrevrangeAsync(redis_key + ':remove_correct_link', 0, -1, 'WITHSCORES'),
        redis.zrevrangeAsync(redis_key + ':create_wrong_link', 0, -1, 'WITHSCORES'),
        redis.zrevrangeAsync(redis_key + ':remove_wrong_link', 0, -1, 'WITHSCORES'),
        redis.zrevrangeAsync(redis_key + ':remove_hinted_wrong_link', 0, -1, 'WITHSCORES'),
    );
    let fields_name = ['score', 'create_correct_link', 'remove_correct_link',
        'create_wrong_link', 'remove_wrong_link', 'remove_hinted_wrong_link'];
    let scoremap = {};
    for (let j = 0; j < results.length; j++) {
        let field = results[j];
        if (field) {
            for (let i = 0; i < field.length; i += 2) {
                let username = field[i];
                let score = parseInt(field[i+1]);
                if (!(username in scoremap)) {
                    scoremap[username] = {
                        score: 0,
                        create_correct_link: 0,
                        remove_correct_link: 0,
                        create_wrong_link: 0,
                        remove_wrong_link: 0,
                        remove_hinted_wrong_link: 0
                    };
                }
                scoremap[username][fields_name[j]] = score;
            }
        }
    }
    for(let username in scoremap){
        let first_edges = await redis.smembersAsync('round:' + round_id + ':distributed:first_edges:' + username);
        console.log('first_edges', username, first_edges);
        scoremap[username].first_edges = first_edges;
        let condition = {
            round_id: round_id,
            username: username
        };
        let operation = {
            $set: scoremap[username]
        };
        RecordModel.update(condition, operation, function(err) {
            if (err) {
                console.log(err);
            }
        });
    }
}

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
    let record = {
        username: player_name,
        round_id: round_id,
        join_time: join_time
    }
    RecordModel.create(record, function (err) {
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

function startGA(round_id){
    var http = require('http');  
    http.get(dev.GA_server + '/ga?data_server=localhost&round_id=' + round_id, (resp) => {
        let data = '';
        // A chunk of data has been recieved.
        resp.on('data', (chunk) => {
            data += chunk;
        });
        // The whole response has been received. Print out the result.
        resp.on('end', () => {
            console.log(data);
        });
    }).on("error", (err) => {
        console.log("Error: " + err.message);
    });
}

function getRandomImage(size) {
    return new Promise((resolve, reject) => {
        redis.srandmember('image:' + size, 1, (err, url) => {
            // body...
            resolve({
                url: url
            });
        });
    });
}

module.exports = function (io) {

    io.on('connection', function (socket) {
        /**
         * Create a new round
         */
        socket.on('newRound', function (data) {
            RoundModel.count({}, async function (err, docs_size) {
                if (err) {
                    console.log(err);
                } else {
                    let imageSrc = data.imageURL;
                    if (!imageSrc && data.imageSize > 0) {
                        let randomUrl = await redis.srandmemberAsync('image:' + data.imageSize, 1);
                        if (randomUrl.length <= 0) {
                            return;
                        }
                        imageSrc = randomUrl[0];
                        console.log(imageSrc);
                    }
                    let index = docs_size;
                    let TIME = util.getNowFormatDate();
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
                        operation.start_time = TIME;
                    }

                    createRecord(data.username, operation.round_id, TIME);

                    RoundModel.create(operation, function (err, doc) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(data.username + ' creates Round' + index);
                            let players = [data.username];
                            io.sockets.emit('roundChanged', {
                                round: doc,
                                players: players,
                                username: data.username,
                                round_id: doc.round_id,
                                action: "create",
                                title: "CreateRound",
                                msg: 'You just create and join round' + doc.round_id
                            });
                            let redis_key = 'round:' + doc.round_id;
                            redis.set(redis_key, JSON.stringify(doc));
                            redis_key = 'round:' + doc.round_id + ':players';
                            redis.sadd(redis_key, data.username);
                        }
                    });
                }
            });
        });

        socket.on('joinRound', function (data) {
            var TIME = util.getNowFormatDate();
            createRecord(data.username, data.round_id, TIME);
            let redis_key = 'round:' + data.round_id + ':players';
            redis.sadd(redis_key, data.username);
            redis.smembers(redis_key, function(err, players){
                if (err) {
                    console.log(err);
                } else {
                    io.sockets.emit('roundPlayersChanged', {
                        players: players,
                        username: data.username,
                        round_id: data.round_id,
                        action: "join",
                        title: "JoinRound",
                        msg: 'You just join round' + data.round_id
                    });
                }
            });
        });

        socket.on('quitRound', function (data) {
            let condition = {
                round_id: data.round_id
            };
            let redis_key = 'round:' + data.round_id + ':players';
            redis.srem(redis_key, data.username);

            redis.smembers(redis_key, function(err, players){
                if(err){
                    console.log(err);
                } else {
                    if(players.length == 0){
                        let operation = {
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
                                            players: players,
                                            username: data.username,
                                            round_id: data.round_id,
                                            action: "quit",
                                            title: "StopRound",
                                            msg: 'You just stop round' + data.round_id
                                        });
                                        let redis_key = 'round:' + data.round_id;
                                        redis.set(redis_key, JSON.stringify(doc));
                                    }
                                });
                                console.log(data.username + ' stops Round' + data.round_id);
                            }
                        });
                    } else {
                        io.sockets.emit('roundPlayersChanged', {
                            players: players,
                            username: data.username,
                            round_id: data.round_id,
                            action: "quit",
                            title: "QuitRound",
                            msg: 'You just quit round' + data.round_id
                        });
                    }
                }
            });
        });

        socket.on('iSolved', function (data) {
            console.log('!!!Round ' + data.round_id + ' is solves!');
            let finish_time = getRoundFinishTime(data.startTime);
            RoundModel.findOne({round_id: data.round_id},
                function (err, doc) {
                    if (err) {
                        console.log(err);
                    } else {
                        if (doc) {
                            if (doc.solved_players == 0) {
                                // only remember the first winner of the round
                                RoundModel.update({
                                    round_id: data.round_id
                                }, {
                                    $set: {
                                        "winner": data.player_name,
                                        "solved_players": 1
                                    }
                                }, function (err) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    else{
                                        socket.broadcast.emit('forceLeave', {
                                            round_id: data.round_id
                                        });
                                    }
                                });
                                saveScore(data.round_id);
                            } else {
                                var solved_players = doc.solved_players;
                                RoundModel.update({
                                    round_id: data.round_id
                                }, {
                                    $set: {
                                        "solved_players": solved_players + 1
                                    }
                                }, function (err) {
                                    if (err) {
                                        console.log(err);
                                    } 
                                    else {
                                        socket.broadcast.emit('forceLeave', {
                                            round_id: data.round_id
                                        });
                                    }
                                });
                            }
                            doc.solved_players += 1;
                            let redis_key = 'round:' + data.round_id;
                            redis.set(redis_key, JSON.stringify(doc));

                            let TIME = util.getNowFormatDate();
                            let operation = {
                                $set: {
                                    "end_time": TIME,
                                    "steps": data.steps,
                                    "time": finish_time,
                                    "total_links": data.totalLinks,
                                    "hinted_links": data.hintedLinks,
                                    "correct_links": data.correctLinks,
                                    "total_steps": data.totalSteps,
                                    "hinted_steps": data.hintedSteps,
                                    "total_hints": data.totalHintsNum,
                                    "correct_hints": data.correctHintsNum
                                }
                            };

                            let condition = {
                                "username": data.player_name,
                                "round_id": data.round_id,
                                "end_time": "-1"
                            };

                            RecordModel.update(condition, operation, function (err, doc) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    console.log(data.player_name + ' saves his record');
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
                tileLinkSteps: data.tileLinkSteps,
                tileLinksFrom: data.tileLinksFrom,
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
                        let redis_key = 'round:' + doc.round_id + ':players';
                        redis.smembers(redis_key, function(err, players){
                            let TIME = util.getNowFormatDate();

                            // set start time for round
                            let operation = {
                                $set: {
                                    start_time: TIME,
                                    players_num: players.length
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
                                                players: players,
                                                username: data.username,
                                                round_id: data.round_id,
                                                action: "start",
                                                title: "StartRound",
                                                msg: 'You just start round' + data.round_id
                                            });
                                            let redis_key = 'round:' + doc.round_id;
                                            redis.set(redis_key, JSON.stringify(doc));
                                                
                                            if(doc.players_num > 1){
                                                //startGA(data.round_id);
                                            }
                                            console.log(data.username + ' starts Round' + data.round_id);
                                            round_starting[data.round_id] = false;
                                        }
                                    });
                                }
                            });
                        });
                    }
                }
            });
        });

        socket.on('saveRecord', function (data) {
            let operation = {};
            let contri = 0;
            let rating = data.rating;
            let condition = {
                "username": data.player_name,
                "round_id": data.round_id
            };

            if (data.finished) {
                operation = {
                    $set: {
                        "rating": rating,
                        "edges": data.edges
                    }
                };
            } else {
                condition["end_time"] = "-1";
                operation = {
                    $set: {
                        "steps": data.steps,
                        "start_time": data.startTime,
                        "time": getRoundFinishTime(data.startTime),
                        "total_links": data.totalLinks,
                        "hinted_links": data.hintedLinks,
                        "correct_links": data.correctLinks,
                        "total_steps": data.totalSteps,
                        "hinted_steps": data.hintedSteps,
                        "total_hints": data.totalHintsNum,
                        "correct_hints": data.correctHintsNum,
                        "rating": rating,
                        "edges": data.edges
                    }
                };
            }

            RecordModel.update(condition, operation, function (err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(data.player_name + ' saves his record: ' + contri.toFixed(3));
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
                res.send(JSON.stringify(docs));
            }
        });
    });

    router.route('/detail/:round_id/:username').all(LoginFirst).get(function (req, res, next) {
        var round_id = req.params.round_id;
        var username = req.params.username;
        RecordModel.findOne({
            round_id: round_id,
            username: username
        }, function(err, record) {
            if (err) {
                res.send("");
            } else if (record) {
                res.send(JSON.stringify(record));          
            }
        });
    });

    router.route('/getRoundPlayers/:round_id').all(LoginFirst).get(function (req, res, next) {
        let redis_key = 'round:' + req.params.round_id + ':players';
        redis.smembers(redis_key, function(err, players){
            if (err) {
                console.log(err);
            } else {
                res.send(JSON.stringify(players));
            }
        })
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
            start_time: 1,
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

    function getWinnerData(round_id) {
        return new Promise((resolve, reject) => {
            RoundModel.findOne({
                round_id: round_id
            }, function (err, doc) {
                if (err) {
                    console.log(err);
                } else if (doc && doc.winner) {
                    RecordModel.findOne({
                        round_id: round_id,
                        username: doc.winner
                    }, function(err, winner) {
                        if (err) {
                            console.log(err);
                        } else if (winner) {
                            let time = winner.time.split(":");
                            let h = parseInt(time[0]);
                            let m = parseInt(time[1]);
                            let s = parseInt(time[2]);
                            let hint_ratio = 0;
                            let hint_precision = 0;
                            if (winner.total_steps > 0 && winner.total_hints > 0) {
                                hint_ratio = r.hinted_steps / r.total_steps;
                                hint_precision = r.correct_hints / r.total_hints;
                            }
                            resolve({
                                "time": h * 3600 + m * 60 + s,
                                "steps": winner.steps,
                                "hint_ratio": hint_ratio,
                                "hint_precision": hint_precision
                            });
                        }
                    });
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