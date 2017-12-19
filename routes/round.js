
'use strict'
var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
var RoundModel = require('../models/round').Round;
var UserModel = require('../models/user').User;
var NodeModel = require('../models/node').Node;
var ActionModel = require('../models/action').Action;
var util = require('./util.js');

var compare = function (prop) {
    return function (obj1, obj2) {
        var val1 = obj1[prop];
        var val2 = obj2[prop];
        if (!isNaN(Number(val1)) && !isNaN(Number(val2))) {
            val1 = Number(val1);
            val2 = Number(val2);
        }
        if (val1 < val2) {
            return 1;
        } else if (val1 > val2) {
            return -1;
        } else {
            return 0;
        }            
    } 
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
            let operation = {
                round_id: index,
                creator: req.session.user.username,
                image: req.body.imageURL,
                shape: req.body.shape,
                level: req.body.level,
                create_time: TIME,
                players_num: req.body.players_num,
            };
            RoundModel.create(operation, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(req.session.user.username + ' creates Round' + index);
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
                        start_time: TIME
                    }
                };
                RoundModel.update(condition, operation, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        res.send({ msg: "Round Starts Now!" });
                        console.log(req.session.user.username + ' starts Round' + req.params.round_id);
                    }
                });
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
 * Stop the round when all players finished
 */

/**
 * Save a record by one user when he gets his puzzle done
 */
router.route('/saveRecord').all(LoginFirst).post(function (req, res, next) {

    let operation = {};
    let contri = 0;
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
                        "records.$.contribution": contri
                    }
                };
            } else if (req.body.finished == "false") {
                operation = {
                    $set: {
                        // records.$.end_time: -1
                        "records.$.steps": req.body.steps,
                        "records.$.time": req.body.time,
                        "records.$.contribution": contri
                    }
                };
            }

            UserModel.update({ username: req.session.user.username, "records.round_id": req.body.round_id }, operation, function (err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    console.log(req.session.user.username + ' saves his record.');
                    res.send({ msg: "Your record has been saved." });
                }
            });
        }
    });
});

/**
 * Get the round contribution rank
 */
router.route('/getRoundRank/:round_id').all(LoginFirst).get(function(req, res, next){
    RoundModel.findOne({ round_id: req.params.round_id }, {_id:0, players:1 }, {}, function(err, doc){
        if(err){
            console.log(err);
        }else{
            if(doc){
                let rankedPlayers=new Array();
                let temp=doc.players;
                temp=temp.sort(compare("contribution"));
                for(let i=0;i<temp.length;i++){
                    let t=temp[i];
                    rankedPlayers.push({
                        "rank": i+1,
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
        tiles_num: req.body.tiles_num,
        steps: req.body.steps,
        time: req.body.time,
        tiles: req.body.tiles,
        shape_array: req.body.shape_array
    }
    var tiles_row=req.body.tile_row;
    var tiles_num=req.body.tiles_num;
    // find all actions and calc the right nodes
    // tileNum tilesPerRow
    // let credits=0;
    // ActionModel.find({ round_id: req.body.round_id, player_name: req.session.user.username }, function(err, docs){
    //     if(err){
    //         console.log(err);
    //     }else{
    //         if(docs){
    //             for(let d of docs){
    //                 if(d.operation=="++" || d.operation=="+"){
    //                 switch (d.direction) {
    //                     case "top":
    //                         if(d.from-tiles_row>=0&&d.from-tiles_row==d.to){
    //                             credits++;
    //                         }
    //                         break;
    //                         case "right":
    //                         if(d.from-tiles_row>=0&&d.from-tiles_row==d.to){
    //                             credits++;
    //                         }
    //                         break;
    //                     default:
    //                         break;
    //                 }
    //             }
    //         }                
    //         }
    //     }
    // });

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


module.exports = router;
