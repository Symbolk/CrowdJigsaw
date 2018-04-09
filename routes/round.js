
'use strict'
var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
var RoundModel = require('../models/round').Round;
var UserModel = require('../models/user').User;
var NodeModel = require('../models/node').Node;
var ActionModel = require('../models/action').Action;
var util = require('./util.js');
var images = require("images");
var PythonShell = require('python-shell');

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
        } else {
            console.log(player_name + ' joins Round' + round_id);
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
        socket.on('join', function (data) {
            // console.log(data);
            socket.emit('hello', { hello: 'Hello ' + data.player_name });
        });
        socket.on('iSolved', function (data) {
            console.log('!!!Round ' + data.round_id + ' : ' + data.player_name + ' solves!');
            let operation = {
                $set: {
                    "MVP": data.player_name,
                    "collective_time": data.time,
                    "collective_steps": data.steps,
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
                    }else{
                        if(doc){
                            if(doc.collective_steps==-1){
                                // only remember the first winner of the round
                                RoundModel.update({ round_id: data.round_id }, operation, function(err){
                                    if(err){
                                        console.log(err);
                                    }
                                });
                            }
                        }
                        socket.broadcast.emit('someoneSolved', data);
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
     * Join a round
     */
    router.route('/joinRound').all(LoginFirst).post(function (req, res, next) {
        let condition = {
            round_id: req.body.round_id
        };
        // check if joinable
        RoundModel.findOne(condition, function (err, doc) {
            if (err) {
                console.log(err);
            } else {
                if (doc.players.length < doc.players_num) {
                    let isIn = doc.players.some(function (p) {
                        return (p.player_name == req.session.user.username);
                    });
                    let TIME = util.getNowFormatDate();
                    if (!isIn) {
                        let operation = {
                            $addToSet: { //if exists, give up add
                                players:
                                    {
                                        player_name: req.session.user.username,
                                        // player_name: req.session.user.username,
                                        join_time: TIME
                                    }
                            }
                        };
                        RoundModel.update(condition, operation, function (err) {
                            if (err) {
                                console.log(err);
                            } else {
                                io.sockets.emit('roundChanged', '');
                                console.log(req.session.user.username + ' joins Round' + condition.round_id);
                                res.send({ msg: 'You joined the round successfully.' });
                                createRecord(req.session.user.username, req.body.round_id, TIME);
                            }
                        });

                    } else {
                        res.send({ msg: "You are already in!" });
                    }
                } else {
                    res.send({ msg: "This round is full." });
                }
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
                        res.send({ msg: "Created round successfully.", round_id: index });
                        // createRecord(req.session.user.username, operation.round_id, TIME);
                    }
                });
            }
        });
    });


    /**
     * Start a round(when the player_num reached)
     */
    router.route('/startRound/:round_id').all(isCreator).get(function (req, res, next) {
        let condition = {
            round_id: req.params.round_id,
        };
        // check if the players are enough
        // findOneAndUpdate
        RoundModel.findOne(condition, function (err, doc) {
            if (err) {
                console.log(err);
            } else {
                if (doc.start_time != '-1') {
                    res.send({ msg: "Round is Already Start!" });
                    return;
                }
                if (doc.players.length == doc.players_num) {
                    let TIME = util.getNowFormatDate();
                    // set start_time for all players
                    for (let p of doc.players) {
                        let operation = {
                            $set: {
                                "records.$.start_time": TIME
                            }
                        };
                        UserModel.update({ username: p.player_name, "records.round_id": req.params.round_id }, operation, function (err) {
                            if (err) {
                                console.log(err);
                            }
                        });
                    }
                    // set start time for round
                    let operation = {
                        $set: {
                            start_time: TIME,
                        }
                    };
                    RoundModel.update(condition, operation, function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            io.sockets.emit('roundChanged', '');
                            res.send({ msg: "Round Starts Now!" });
                            console.log(req.session.user.username + ' starts Round' + req.params.round_id);
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
                } else {
                    res.send({ msg: "Players are not enough!" });
                }
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
                            $pull: { //if exists, give up add
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

        let totalLinks = req.body.totalLinks;
        let hintedLinks = req.body.hintedLinks;

        let totalHintsNum = req.body.totalHintsNum;
        let correctHintsNum = req.body.correctHintsNum;

        ActionModel.find({ round_id: req.body.round_id, player_name: req.session.user.username }, { _id: 0, contribution: 1 }, function (err, docs) {
            if (err) {
                console.log(err);
            } else {
                for (let d of docs) {
                    contri += d.contribution;
                }
                if (req.body.finished == "true") {
                    let TIME = util.getNowFormatDate();
                    operation = {
                        $set: {
                            "records.$.end_time": TIME,
                            "records.$.steps": req.body.steps,
                            "records.$.time": req.body.time,
                            "records.$.contribution": contri.toFixed(3),
                            "records.$.total_links": req.body.totalLinks,
                            "records.$.hinted_links": req.body.hintedLinks,
                            "records.$.total_hints": req.body.totalHintsNum,
                            "records.$.correct_hints": req.body.correctHintsNum                              
                        }
                    };
                } else if (req.body.finished == "false") {
                    operation = {
                        $set: {
                            "records.$.end_time": "-1",
                            "records.$.steps": req.body.steps,
                            "records.$.time": req.body.time,
                            "records.$.contribution": contri.toFixed(3),
                            "records.$.total_links": req.body.totalLinks,
                            "records.$.hinted_links": req.body.hintedLinks,
                            "records.$.total_hints": req.body.totalHintsNum,
                            "records.$.correct_hints": req.body.correctHintsNum 
                        }
                    };
                }

                UserModel.update({ username: req.session.user.username, "records.round_id": req.body.round_id }, operation, function (err, doc) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log(req.session.user.username + ' saves his record: ' + contri);
                        res.send({ contribution: contri });
                    }
                });
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
            collective_time: 1
        };
        RoundModel.findOne(condition, fields, function (err, doc) {
            if (err) {
                console.log(err);
            } else {
                res.send(doc);
            }
        });
    });
    return router;
};
