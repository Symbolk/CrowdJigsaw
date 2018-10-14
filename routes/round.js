
'use strict'
var express = require('express');
var router = express.Router();
var RoundModel = require('../models/round').Round;
var UserModel = require('../models/user').User;
var ActionModel = require('../models/action').Action;
var util = require('./util.js');
var images = require("images");
var PythonShell = require('python-shell');

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
    RoundModel.findOne({ round_id: req.params.round_id }, { _id: 0, creator: 1 }, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            if (!req.session.user) {
                req.session.error = 'Please Login First!';
                return res.redirect('/login');
            }

            if (doc.creator != req.session.user.username) {
                req.session.error = "You are not the Boss!";
            }
            next();
        }
    });
}

module.exports = function (io) {

    io.on('connection', function (socket) {
        socket.on('joinRound', function (data) {
            let condition = {
                round_id: data.round_id
            };
            // check if joinable
            RoundModel.findOne(condition, function (err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    if (doc.players.length < doc.players_num) {
                        console.log(doc.players);
                        let isIn = doc.players.some(function (p) {
                            return (p.player_name == data.username);
                        });
                        let TIME = util.getNowFormatDate();
                        if (!isIn) {
                            let operation = {
                                $addToSet: { //if exists, give up add
                                    players:
                                    {
                                        player_name: data.username,
                                        join_time: TIME
                                    }
                                }
                            };
                            RoundModel.update(condition, operation, function (err) {
                                if (err) {
                                    console.log(err);
                                } else {
                                    io.sockets.emit('roundChanged', '');
                                    console.log(data.username + ' joins Round' + condition.round_id);
                                    createRecord(data.username, data.round_id, TIME);
                                }
                            });

                        }
                    }
                }
            });
        });
        socket.on('iSolved', function (data) {
            console.log('!!!Round ' + data.round_id + ' : ' + data.player_name + ' solves!');
            let operation = {
                $set: {
                    "winner": data.player_name,
                    "winner_time": getRoundFinishTime(data.time),
                    "winner_steps": data.steps,
                    "total_links": data.totalLinks,
                    "hinted_links": data.hintedLinks,
                    "total_hints": data.totalHintsNum,
                    "correct_hints": data.correctHintsNum
                }
            };
            RoundModel.findOne({ round_id: data.round_id },
                function (err, doc) {
                    if (err) {
                        console.log(err);
                    } else {
                        if (doc) {
                            if (doc.winner_steps == -1) {
                                // only remember the first winner of the round
                                RoundModel.update({ round_id: data.round_id }, operation, function (err) {
                                    if (err) {
                                        console.log(err);
                                    }
                                });
                            }
                        }
                        socket.broadcast.emit('someoneSolved', data);
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

            let operation = {
                $set: {
                    save_game: save_game
                }
            };
            UserModel.findOneAndUpdate({ username: data.player_name }, operation, function (err, doc) {
                if (err) {
                    console.log(err);
                    socket.emit('gameSaved', { err: err });
                } else {
                    socket.emit('gameSaved', { success: true, round_id: data.round_id, player_name: data.player_name });
                }
            });
        });

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
                    if (doc.start_time != '-1') {
                        return;
                    }
                    let TIME = util.getNowFormatDate();
                    // set start_time for all players
                    for (let p of doc.players) {
                        let operation = {
                            $set: {
                                "records.$.start_time": TIME
                            }
                        };
                        UserModel.update({ username: p.player_name, "records.round_id": data.round_id }, operation, function (err) {
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
                    RoundModel.update(condition, operation, function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            io.sockets.emit('roundChanged', '');
                            console.log(data.username + ' starts Round' + data.round_id);
                        }
                    });
                    /*
                    // run genetic algorithm
                    console.log('start running python script of GA algorithm for round %d.', doc.round_id);
                    var path = require('path');
                    var options = {
                        mode: 'text',
                        pythonPath: 'python3',
                        pythonOptions: ['-u'], // get print results in real-time
                        scriptPath: path.resolve(__dirname, '../../gaps/bin'),
                        args: ['--algorithm', 'crowd',
                            '--image', path.resolve(__dirname, '../public') + '/' + doc.image,
                            '--size', doc.tileWidth.toString(),
                            '--cols', doc.tilesPerRow.toString(),
                            '--rows', doc.tilesPerColumn.toString(),
                            '--population', '600',
                            '--generations', '1000000000',
                            '--roundid', doc.round_id.toString()]
                    };
                    PythonShell.run('gaps', options, function (err, results) {
                        if (err)
                            console.log(err);
                        // results is an array consisting of messages collected during execution
                        // if GA founds a solution, the last element in results is "solved".
                        console.log('results: %j', results);
                        console.log('GA algorithm for round %d ends.', doc.round_id);
                    });*/
                }
            });
        });

        socket.on('saveRecord', function (data) {
            let operation = {};
            let contri = 0;
            let rating = data.rating;
            RoundModel.findOne({ round_id: data.round_id }, function (err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    if (doc && doc.contribution) {
                        if (doc.contribution.hasOwnProperty(data.username)) {
                            contri = doc.contribution[data.username];
                        }
                        if (data.finished) {
                            let TIME = util.getNowFormatDate();
                            operation = {
                                $set: {
                                    "records.$.end_time": TIME,
                                    "records.$.steps": data.steps,
                                    "records.$.time": getRoundFinishTime(data.startTime),
                                    "records.$.contribution": contri.toFixed(3),
                                    "records.$.total_links": data.totalLinks,
                                    "records.$.hinted_links": data.hintedLinks,
                                    "records.$.total_hints": data.totalHintsNum,
                                    "records.$.correct_hints": data.correctHintsNum,
                                    "records.$.rating": rating
                                }
                            };
                        } 
                        else {
                            operation = {
                                $set: {
                                    "records.$.end_time": "-1",
                                    "records.$.steps": data.steps,
                                    "records.$.time": getRoundFinishTime(data.startTime),
                                    "records.$.contribution": contri.toFixed(3),
                                    "records.$.total_links": data.totalLinks,
                                    "records.$.hinted_links": data.hintedLinks,
                                    "records.$.total_hints": data.totalHintsNum,
                                    "records.$.correct_hints": data.correctHintsNum,
                                    "records.$.rating": rating
                                }
                            };
                        }

                        let condition = {
                            username: data.username,
                            "records.round_id": data.round_id
                        };

                        UserModel.update(condition, operation, function (err, doc) {
                            if (err) {
                                console.log(err);
                            } else {
                                console.log(data.username + ' saves his record: ' + contri.toFixed(3));
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
     * Get player list for one round
     */
    router.route('/getPlayers/:round_id').all(LoginFirst).get(function (req, res, next) {
        let condition = {
            round_id: req.params.round_id
        };
        RoundModel.findOne(condition, function (err, doc) {
            if (err) {
                console.log(err);
            } else {
                res.send(doc.players);
            }
        });
    });

    /**
     * Get a specify round
     */
    router.route('/getRound/:round_id').all(LoginFirst).get(function (req, res, next) {
        let condition = {
            round_id: req.params.round_id
        };
        RoundModel.findOne(condition, function (err, doc) {
            if (err) {
                console.log(err);
            } else {
                res.send(doc);
            }
        });
    });

    /**
     * Create a new round
     */
    router.route('/newRound').all(LoginFirst).post(function (req, res, next) {
        RoundModel.find({}, function (err, docs) {
            if (err) {
                console.log(err);
            } else {
                let index = docs.length;
                let TIME = util.getNowFormatDate();
                let imageSrc = req.body.imageURL;
                let image = images('public/' + imageSrc);
                let size = image.size();
                let imageWidth = size.width;
                let imageHeight = size.height;
                let tileWidth = 64;
                let tilesPerRow = Math.floor(imageWidth / tileWidth);
                let tilesPerColumn = Math.floor(imageHeight / tileWidth);
                let shapeArray = util.getRandomShapes(tilesPerRow, tilesPerColumn, req.body.shape, req.body.edge);
                let operation = {
                    round_id: index,
                    creator: req.session.user.username,
                    image: imageSrc,
                    level: req.body.level,
                    shape: req.body.shape,
                    edge: req.body.edge,
                    border: req.body.border,
                    create_time: TIME,
                    players_num: req.body.players_num,
                    imageWidth: imageWidth,
                    imageHeight: imageHeight,
                    tileWidth: tileWidth,
                    tilesPerRow: tilesPerRow,
                    tilesPerColumn: tilesPerColumn,
                    tile_num: tilesPerRow * tilesPerColumn,
                    row_num: tilesPerRow,
                    shapeArray: shapeArray
                };

                RoundModel.create(operation, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(req.session.user.username + ' creates Round' + index);
                        io.sockets.emit('roundChanged', '');
                        res.send({ msg: 'Round ' + index + ' created successfully.', round_id: index });
                        // createRecord(req.session.user.username, operation.round_id, TIME);
                    }
                });
            }
        });
    });


    /**
     * Quit a round, either by user or by accident, when unfinished
     */
    router.route('/quitRound/:round_id').all(LoginFirst).get(function (req, res, next) {
        let condition = {
            round_id: req.params.round_id
        };
        // check if joinable
        RoundModel.findOne(condition, function (err, doc) {
            if (err) {
                console.log(err);
            } else {
                let isIn = doc.players.some(function (p) {
                    return (p.player_name == req.session.user.username);
                });
                if (isIn) {
                    if (doc.players.length == 1) { // the last player
                        let operation = {
                            $pull: {
                                players:
                                {
                                    player_name: req.session.user.username
                                }
                            },
                            end_time: util.getNowFormatDate()
                        };
                        RoundModel.update(condition, operation, function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                io.sockets.emit('roundChanged', '');
                                console.log(req.session.user.username + ' stops Round' + req.params.round_id);
                                res.send({
                                    msg: "You just stopped the round...",
                                    stop_round: true
                                });
                            }
                        });
                    } else { // online>=2
                        let operation = {
                            $pull: { //if exists, give up add
                                players:
                                {
                                    player_name: req.session.user.username
                                }
                            }
                        };
                        RoundModel.update(condition, operation, function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                io.sockets.emit('roundChanged', '');
                                console.log(req.session.user.username + ' quits Round' + req.params.round_id);
                                res.send({ msg: "You just quitted the round..." });
                            }
                        });
                    }
                    // update the record
                } else {
                    res.send({ msg: "You are not even in the round!" });
                }
            }
        });
    });

    /**
     * Save a record by one user when he gets his puzzle done
     */
    router.route('/saveRecord').all(LoginFirst).post(function (req, res, next) {
        let operation = {};
        let contri = 0;
        let rating = req.body.rating;
        RoundModel.findOne({ round_id: req.body.round_id }, function (err, doc) {
            if (err) {
                console.log(err);
            } else {
                if (doc && doc.contribution) {
                    if (doc.contribution.hasOwnProperty(req.session.user.username)) {
                        contri = doc.contribution[req.session.user.username];
                    }
                    if (req.body.finished == "true") {
                        let TIME = util.getNowFormatDate();
                        operation = {
                            $set: {
                                "records.$.end_time": TIME,
                                "records.$.steps": req.body.steps,
                                "records.$.time": getRoundFinishTime(req.body.startTime),
                                "records.$.contribution": contri.toFixed(3),
                                "records.$.total_links": req.body.totalLinks,
                                "records.$.hinted_links": req.body.hintedLinks,
                                "records.$.total_hints": req.body.totalHintsNum,
                                "records.$.correct_hints": req.body.correctHintsNum,
                                "records.$.rating": rating
                            }
                        };
                    } else if (req.body.finished == "false") {
                        operation = {
                            $set: {
                                "records.$.end_time": "-1",
                                "records.$.steps": req.body.steps,
                                "records.$.time": getRoundFinishTime(req.body.startTime),
                                "records.$.contribution": contri.toFixed(3),
                                "records.$.total_links": req.body.totalLinks,
                                "records.$.hinted_links": req.body.hintedLinks,
                                "records.$.total_hints": req.body.totalHintsNum,
                                "records.$.correct_hints": req.body.correctHintsNum,
                                "records.$.rating": rating
                            }
                        };
                    }

                    let condition = {
                        username: req.session.user.username,
                        "records.round_id": req.body.round_id
                    };

                    UserModel.update(condition, operation, function (err, doc) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(req.session.user.username + ' saves his record: ' + contri.toFixed(3));
                            res.send({ msg: "Record has been saved." });
                        }
                    });
                }
            }
        });
    });

    /**
     * Get the round contribution rank
     */
    router.route('/getRoundRank/:round_id').all(LoginFirst).get(function (req, res, next) {
        RoundModel.findOne({ round_id: req.params.round_id }, { _id: 0, players: 1 }, {}, function (err, doc) {
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
                    res.send({ AllPlayers: rankedPlayers });
                }
            }
        });
    });

    /**
     * Save the game status and calculate the progress
     */
    router.route('/saveGame').all(LoginFirst).post(function (req, res, next) {
        var save_game = {
            round_id: req.body.round_id,
            steps: req.body.steps,
            realSteps: req.body.realSteps,
            time: req.body.time,
            tiles: req.body.tiles,
            tileHintedLinks: req.body.tileHintedLinks,
            totalHintsNum: req.body.totalHintsNum,
            correctHintsNum: req.body.correctHintsNum
        }

        let operation = {
            $set: {
                save_game: save_game
            }
        };
        UserModel.findOneAndUpdate({ username: req.session.user.username }, operation, function (err, doc) {
            if (err) {
                console.log(err);
            } else {
                res.send({ msg: "Your game has been saved." });
            }
        });
    });

    /**
     * Load a game by one user
     */
    router.route('/loadGame').all(LoginFirst).get(function (req, res, next) {
        let condition = {
            username: req.session.user.username
        };
        UserModel.findOne(condition, function (err, doc) {
            if (err) {
                console.log(err);
            } else {
                res.send(JSON.stringify(doc.save_game));
            }
        });
    });

    /**
     * Get ShapeArray by one user
     */
    router.route('/getShapeArray/:round_id').all(LoginFirst).get(function (req, res, next) {
        let condition = {
            round_id: parseInt(req.params.round_id)
        };
        RoundModel.findOne(condition, function (err, doc) {
            if (err) {
                console.log(err);
            } else {
                res.send(doc.shapeArray);
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
            RoundModel.findOne({ round_id: round_id }, function (err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    if (doc.winner) {
                        UserModel.findOne({ username: doc.winner }, { _id: 0, records: 1 }, function (err, d) {
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
            });
        });
    }
    /**
     * Get the data required by statistics
     */
    function getWinnerData(round_id) {
        return new Promise((resolve, reject) => {
            RoundModel.findOne({ round_id: round_id }, function (err, doc) {
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
