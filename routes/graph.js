'use strict'
/**
 * API operations related with the sequence&links
 * 
 */

var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
var NodeModel = require('../models/node').Node;
var UserModel = require('../models/user').User;
var RoundModel = require('../models/round').Round;
var ActionModel = require('../models/action').Action;
var util = require('./util.js');

/**
 * Get all the round graph
 */
router.route('/:round_id').all(JoinRoundFirst).get(function (req, res) {
    NodeModel.find({ round_id: req.params.round_id }, function (err, docs) {
        if (err) {
            console.log(err);
        } else {
            res.send(JSON.stringify(docs));
        }
    });
});


/**
 * Write one action into the action sequence
 */
function writeAction(NAME, round_id, operation, from, direction, to) {
    var action = {
        round_id: round_id,
        time_stamp: util.getNowFormatDate(),
        player_name: NAME,
        operation: operation,
        from: from,
        direction: to,
        to: direction
    };
    ActionModel.create(action, function (err) {
        if (err) {
            console.log(err);
            return false;
        } else {
            return true;
        }
    });
}

/**
 * Check the links and format the action object
 */
router.route('/check').post(function (req, res, next) {
    let round_id = req.body.round_id;
    var NAME = req.session.user.username;
    let selected = req.body.selectedTile;
    let around = req.body.aroundTiles;
    let msgs = new Array();
    // For every posted nodes, add them to the nodes(graph), and decide which way 
    var dirs = ['top', 'right', 'bottom', 'left'];
    NodeModel.findOne({ round_id: round_id, index: selected }, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            if (!doc) {
                // new a node and new the links
                // all ++
                let new_node = {
                    round_id: round_id,
                    index: selected
                };
                NodeModel.create(new_node, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        for (let d = 0; d < around.length; d++) { // d=0,1,2,3
                            let to = around[d];
                            if (to.before != to.after) {
                                // In practice, to.before is bound to be -1
                                if (to.before == -1) {
                                    let temp = {};
                                    temp[dirs[d]] = {
                                        index: to.after,
                                        sup_num: 1
                                    };
                                    NodeModel.findOneAndUpdate(
                                        { round_id: round_id, index: selected },
                                        { $push: temp },
                                        function (err) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                writeAction(NAME, round_id, "++", selected, dirs[d], to.after);
                                                msgs.push('++ ' + selected + '-' + dirs[d] + '->' + to.after);
                                            }
                                        });
                                } else if (to.after == -1) {
                                    console.log("Unreachable case1.");
                                } else { // to.before!=to.after!=-1
                                    console.log("Unreachable case2.");
                                }
                            }
                        }
                    }
                });
            } else {
                // this node in this round already exists
                for (let d = 0; d < around.length; d++) { // d=0,1,2,3
                    let to = around[d];
                    if (to.before != to.after) {
                        if (to.before == -1) { // new link in user view
                            if (doc[dirs[d]].length == 0) {
                                // ++ in global view
                                let temp = {};
                                temp[dirs[d]] = {
                                    index: to.after,
                                    sup_num: 1
                                };
                                NodeModel.findOneAndUpdate(
                                    { round_id: round_id, index: selected },
                                    { $push: temp },
                                    function (err) {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            writeAction(NAME, round_id, "++", selected, dirs[d], to.after);
                                            msgs.push('++ ' + selected + '-' + dirs[d] + '->' + to.after);
                                        }
                                    });
                            } else {
                                let existed = false;
                                for (let i of doc[dirs[d]]) {
                                    if (i.index == to.after) {
                                        // + 
                                        existed = true;
                                        let condition = {
                                            round_id: round_id, index: selected
                                        };
                                        condition[dirs[d] + '.index'] = to.after;
                                        let temp = {};
                                        temp[dirs[d] + '.$.sup_num'] = 1;
                                        NodeModel.findOneAndUpdate(condition,
                                            { $inc: temp },
                                            function (err, doc) {
                                                if (err) {
                                                    console.log(err);
                                                } else {
                                                    writeAction(NAME, round_id, "+", selected, dirs[d], to.after);
                                                    msgs.push('+ ' + selected + '-' + dirs[d] + '->' + to.after);
                                                }
                                            });
                                    }
                                }
                                if (!existed) {
                                    // ++
                                    let temp = {};
                                    temp[dirs[d]] = {
                                        index: to.after,
                                        sup_num: 1
                                    };
                                    NodeModel.update(
                                        { round_id: round_id, index: selected },
                                        { $push: temp },
                                        function (err) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                writeAction(NAME, round_id, "++", selected, dirs[d], to.after);
                                                msgs.push('++ ' + selected + '-' + dirs[d] + '->' + to.after);
                                            }
                                        });
                                }
                            }
                        } else if (to.after == -1) {
                            // existed&&sup_num>=1
                            if (doc[dirs[d]].length > 0) {
                                // --
                                let condition = {
                                    round_id: round_id, index: selected
                                };
                                condition[dirs[d] + '.index'] = to.before;
                                let temp = {};
                                temp[dirs[d] + '.$.sup_num'] = -1;
                                temp[dirs[d] + '.$.opp_num'] = 1;
                                NodeModel.findOneAndUpdate(condition,
                                    { $inc: temp },
                                    function (err, doc) {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            let op = '';
                                            for (let i of doc[dirs[d]]) {
                                                if (i.index == to.before) {
                                                    if (i.sup_num == 0) {
                                                        op = '-- ';
                                                    } else {
                                                        op = '- ';
                                                    }
                                                }
                                            }
                                            writeAction(NAME, round_id, op, selected, dirs[d], to.before);
                                            msgs.push(op + selected + '-' + dirs[d] + '->' + to.before);
                                        }
                                    });
                            }
                        } else {
                            // - 
                            var to_send = {};
                            let condition = {
                                round_id: round_id, index: selected
                            };
                            condition[dirs[d] + '.index'] = to.before;
                            let temp = {};
                            temp[dirs[d] + '.$.sup_num'] = -1;
                            temp[dirs[d] + '.$.opp_num'] = 1;
                            NodeModel.findOneAndUpdate(condition,
                                { $inc: temp },
                                function (err, doc) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        let op = '';
                                        for (let i of doc[dirs[d]]) {
                                            if (i.index == to.before) {
                                                if (i.sup_num == 0) {
                                                    op = '-- ';
                                                } else {
                                                    op = '- ';
                                                }
                                            }
                                        }
                                        writeAction(NAME, round_id, op, selected, dirs[d], to.before);
                                        msgs.push(op + selected + '-' + dirs[d] + '->' + to.before);
                                    }
                                });
                            // +
                            let existed = false;
                            for (let i of doc[dirs[d]]) {
                                if (i.index == to.after) {
                                    existed = true;
                                    let condition = {
                                        round_id: round_id, index: selected
                                    };
                                    condition[dirs[d] + '.index'] = to.after;
                                    let temp = {};
                                    temp[dirs[d] + '.$.sup_num'] = 1;
                                    NodeModel.findOneAndUpdate(condition,
                                        { $inc: temp },
                                        function (err, doc) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                msgs.push('+ ' + selected + '-' + dirs[d] + '->' + to.after);
                                                writeAction(NAME, round_id, "+", selected, dirs[d], to.after);
                                            }
                                        });
                                }
                            }
                            if (!existed) {
                                // ++
                                let temp = {};
                                temp[dirs[d]] = {
                                    index: to.after,
                                    sup_num: 1
                                };
                                NodeModel.update(
                                    { round_id: round_id, index: selected },
                                    { $push: temp },
                                    function (err) {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            msgs.push('++ ' + selected + '-' + dirs[d] + '->' + to.after);
                                            writeAction(NAME, round_id, "++", selected, dirs[d], to.after);
                                        }
                                    });
                            }
                        }
                    }
                }
            }
        }
    });
});


/**
 * Get hints from the current graph data
 * @return an array of recommended index, in 4 directions of the tile
 */
router.route('/getHints/:round_id/:selected').all(JoinRoundFirst).get(function (req, res) {
// router.route('/getHints/:round_id/:selected').get(function (req, res) { // 4 Test
    // query the 4 dirs of the selected tile
    let condition = {
        round_id: req.params.round_id,
        index: req.params.selected
    };
    // find the most-supported one of every dir
    var hintIndexes = new Array();
    var dirs = ['top', 'right', 'bottom', 'left'];

    NodeModel.findOne(condition, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            if (!doc) {
                res.send({ msg: "No hints." });
            } else {
                for (let d = 0; d < 4; d++) {
                    let alternatives = doc[dirs[d]];
                    if (alternatives.length == 0) {
                        hintIndexes.push(-1);
                    } else {
                        let most_sup = alternatives[0];
                        for (let a of alternatives) {
                            if (a.sup_num > most_sup.sup_num) {
                                most_sup = a;
                            }
                        }
                        hintIndexes.push(most_sup.index);
                    }
                }
                res.send(JSON.stringify(hintIndexes));
            }
        }
    });
});

/**
 * Access Control
 * @param {*} req 
 * @param {*} res 
 * @param {*} next 
 */
function JoinRoundFirst(req, res, next) {

    RoundModel.findOne({ round_id: req.params.round_id }, { _id: 0, players: 1 }, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            if (!req.session.user) {
                req.session.error = 'Please Login First!';
                return res.redirect('/login');
            }

            let hasJoined = doc.players.some(function (p) {
                return (p.player_name == req.session.user.username);
            });
            if (!hasJoined) {
                req.session.error = "You haven't joined this Round!";
                return res.redirect('/home');
            }
            next();
        }
    });
}


module.exports = router;
