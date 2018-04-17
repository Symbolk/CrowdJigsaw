'use strict'
/**
 * API operations related with the sequence&links
 * 
 */

var express = require('express');
var router = express.Router();
const mongoose = require('mongoose');
var NodeModel = require('../models/node').Node;
var RoundModel = require('../models/round').Round;
var ActionModel = require('../models/action').Action;
var util = require('./util.js');
var constants = require('../config/constants');
var hint_weight = constants.hint_weight;
/**
 * Get the best link with different strategies
 * @param {*} links
 */
function getBest(links) {
    if (links) {
        let sortedLinks = links.sort(util.descending("sup_num"));
        return sortedLinks[0].index;
    } else {
        console.log("Unreachable.");
    }
}


/**
 * Calculate the contribution according to the alpha decay function
 * num_before can be sup or opp
 */
function calcContri(operation, num_before) {
    var alpha = constants.alpha;
    num_before = Number(num_before);
    let contribution = 0;
    switch (operation) {
        case "++":
            contribution = 1;
            break;
        case "+":
            contribution = Math.pow(alpha, num_before);
            break;
        case "--":
            contribution = 1;
            break;
        case "-":
            contribution = Math.pow(alpha, num_before);
            break;
        default:
            contribution = 0;
    }
    return contribution.toFixed(3);
}

/**
 * Write one action into the action sequence
 */
function writeAction(NAME, round_id, operation, from, direction, to, contri) {
    ActionModel.find({ round_id: round_id }, function (err, docs) {
        if (err) {
            console.log(err);
        } else {
            let aid = docs.length;
            var action = {
                round_id: round_id,
                action_id: aid,
                time_stamp: util.getNowFormatDate(),
                player_name: NAME,
                operation: operation,
                from: from,
                direction: direction,
                to: to,
                contribution: contri
            };
            ActionModel.create(action, function (err) {
                if (err) {
                    console.log(err);
                    return false;
                } else {
                    return true;
                }
            });
            // Update the players contribution in this round
            RoundModel.findOneAndUpdate(
                { round_id: round_id, "players.player_name": NAME },
                { $inc: { "players.$.contribution": contri } },
                // { new: true },
                function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
        }
    });
}

// Bidirectionally add one link to the other side
function mutualAdd(round_id, from, to, dir, isHinted, NAME) {

    NodeModel.findOne({ round_id: round_id, index: from }, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            if (!doc) {
                // ++ node
                let new_node = {
                    round_id: round_id,
                    index: from
                };
                NodeModel.create(new_node, function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        // and push a new one
                        let temp = {};
                        let support = isHinted ? hint_weight : 1;
                        temp[dir] = {
                            index: to,
                            sup_num: support,
                            supporters: [{ player_name: NAME }]
                        };
                        NodeModel.update(
                            { round_id: round_id, index: from },
                            { $push: temp },
                            function (err) {
                                if (err) {
                                    console.log(err);
                                }
                            });
                    }
                });
            } else {
                // the from node exists
                // check if the link exists
                if (doc[dir].length == 0) {
                    // no one single link in this dir
                    // ++ link
                    let temp = {};
                    let support = isHinted ? hint_weight : 1;
                    temp[dir] = {
                        index: to,
                        sup_num: support,
                        supporters: [{ player_name: NAME }]
                    };
                    NodeModel.update(
                        { round_id: round_id, index: from },
                        { $push: temp },
                        function (err) {
                            if (err) {
                                console.log(err);
                            }
                        });
                } else {
                    // check if the to link exists
                    let existed = false;
                    for (let i of doc[dir]) {
                        if (i.index == to) {
                            // + link
                            existed = true;
                            let condition = {
                                round_id: round_id, index: from
                            };
                            condition[dir + '.index'] = to;
                            let temp = {};
                            temp[dir + '.$.sup_num'] = isHinted ? hint_weight : 1;
                            let temp2 = {};
                            temp2[dir + '.$.supporters'] = { player_name: NAME };
                            let temp3 = {};
                            temp3[dir + '.$.opposers'] = { player_name: NAME };
                            let operation = {
                                $inc: temp,
                                $addToSet: temp2,
                                $pull: temp3
                            };
                            NodeModel.update(condition,
                                operation,
                                function (err) {
                                    if (err) {
                                        console.log(err);
                                    }
                                });
                        }
                    }
                    // if not, push a new one
                    if (!existed) {
                        // ++ link
                        let temp = {};
                        let support = isHinted ? hint_weight : 1;
                        temp[dir] = {
                            index: to,
                            sup_num: support,
                            supporters: [{ player_name: NAME }]
                        };

                        NodeModel.update(
                            { round_id: round_id, index: from },
                            { $push: temp },
                            function (err) {
                                if (err) {
                                    console.log(err);
                                }
                            });
                    }
                }
            }
        }
    });
}


/**
 * Bidirectionally remove one link to the other side
 */
function mutualRemove(round_id, from, to, dir, NAME) {
    NodeModel.findOne({ round_id: round_id, index: from }, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            if (doc) {
                // it's sure that it exists
                if (doc[dir].length > 0) {
                    // --/-
                    let condition = {
                        round_id: round_id, index: from
                    };
                    condition[dir + '.index'] = to;
                    let temp = {};
                    temp[dir + '.$.sup_num'] = -1;
                    temp[dir + '.$.opp_num'] = 1;
                    let temp2 = {};
                    temp2[dir + '.$.supporters'] = { player_name: NAME };
                    let temp3 = {};
                    temp3[dir + '.$.opposers'] = { player_name: NAME };
                    let operation = {
                        $inc: temp,
                        $pull: temp2,
                        $push: temp3
                    };
                    NodeModel.find(condition, function (err, doc) {
                        if (err) {
                            console.log(err);
                        } else {
                            NodeModel.update(condition, operation, function (err) {
                                if (err) {
                                    console.log(err);
                                }
                            });
                        }
                    });
                }
            }
        }
    });
}


module.exports = function (io) {
    io.on('connection', function (socket) {
        socket.on('upload', function (data) {
            check(data);
        });
    });

    function check(params) {
        var dirs = ['top', 'right', 'bottom', 'left'];
        var reverseDirs = ['bottom', 'left', 'top', 'right'];
        let round_id = params.round_id;
        let selected = params.selectedTile;
        let around = JSON.parse(params.aroundTiles);
        let isHinted = params.isHinted;
        var NAME = isHinted ? "" : params.player_name;

        let msgs = new Array();

        // For every posted nodes, add them to the nodes(graph), and decide which way 
        NodeModel.findOne({ round_id: round_id, index: selected }, function (err, doc) {
            if (err) {
                console.log(err);
            } else {
                if (!doc) { // Case1: Add(node not existed)
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
                                        let support = isHinted ? hint_weight : 1;
                                        temp[dirs[d]] = {
                                            index: to.after,
                                            sup_num: support,
                                            supporters: [{ player_name: NAME }]
                                        };
                                        NodeModel.update(
                                            { round_id: round_id, index: selected },
                                            { $push: temp },
                                            function (err) {
                                                if (err) {
                                                    console.log(err);
                                                } else {
                                                    writeAction(NAME, round_id, "++", selected, dirs[d], to.after, calcContri("++", 0));
                                                    mutualAdd(round_id, to.after, selected, reverseDirs[d], isHinted, NAME);
                                                }
                                            });
                                    } else if (to.after == -1) { // to.before!=-1 to.after=-1
                                        console.log("Case1 " + round_id + ":" + to.before + '->' + to.after);
                                    } else { // to.before!=to.after!=-1
                                        console.log("Case2." + round_id + ":" + to.before + '->' + to.after);
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
                            if (to.before == -1) {  // Case2: Add(node existed, -1 to !-1)
                                if (doc[dirs[d]].length == 0) {
                                    // ++ in global view
                                    let temp = {};
                                    let support = isHinted ? hint_weight : 1;
                                    temp[dirs[d]] = {
                                        index: to.after,
                                        sup_num: support,
                                        supporters: [{ player_name: NAME }]
                                    };
                                    NodeModel.update(
                                        { round_id: round_id, index: selected },
                                        { $push: temp },
                                        function (err) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                writeAction(NAME, round_id, "++", selected, dirs[d], to.after, calcContri("++", 0));
                                                mutualAdd(round_id, to.after, selected, reverseDirs[d], isHinted, NAME);
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
                                            let sup_before = i.sup_num;
                                            condition[dirs[d] + '.index'] = to.after;

                                            let temp = {};
                                            temp[dirs[d] + '.$.sup_num'] = isHinted ? hint_weight : 1;
                                            let temp2 = {};
                                            temp2[dirs[d] + '.$.supporters'] = { player_name: NAME };
                                            let temp3 = {};
                                            temp3[dirs[d] + '.$.opposers'] = { player_name: NAME };
                                            let operation = {
                                                $inc: temp,
                                                $addToSet: temp2,
                                                $pull: temp3
                                            };

                                            NodeModel.update(condition,
                                                operation,
                                                function (err, doc) {
                                                    if (err) {
                                                        console.log(err);
                                                    } else {
                                                        writeAction(NAME, round_id, "+", selected, dirs[d], to.after, calcContri("+", sup_before));
                                                        mutualAdd(round_id, to.after, selected, reverseDirs[d], isHinted, NAME);
                                                    }
                                                });
                                        }
                                    }
                                    if (!existed) {
                                        // ++
                                        let temp = {};
                                        let support = isHinted ? hint_weight : 1;
                                        temp[dirs[d]] = {
                                            index: to.after,
                                            sup_num: support,
                                            supporters: [{ player_name: NAME }]
                                        };
                                        NodeModel.update(
                                            { round_id: round_id, index: selected },
                                            { $push: temp },
                                            function (err) {
                                                if (err) {
                                                    console.log(err);
                                                } else {
                                                    writeAction(NAME, round_id, "++", selected, dirs[d], to.after, calcContri("++", 0));
                                                    // res.send({msg:'++ ' + selected + '-' + dirs[d] + '->' + to.after});
                                                    mutualAdd(round_id, to.after, selected, reverseDirs[d], isHinted, NAME);
                                                }
                                            });
                                    }
                                }
                            } else if (to.after == -1) { // Case3: Remove(edge existed, !-1 to -1)
                                // assert: existed&&sup_num>=1
                                if (doc[dirs[d]].length > 0) {
                                    // --/-
                                    let condition = {
                                        round_id: round_id, index: selected
                                    };
                                    condition[dirs[d] + '.index'] = to.before;
                                    let temp = {};
                                    temp[dirs[d] + '.$.sup_num'] = -1;
                                    temp[dirs[d] + '.$.opp_num'] = 1;
                                    let temp2 = {};
                                    temp2[dirs[d] + '.$.supporters'] = { player_name: NAME };
                                    let temp3 = {};
                                    temp3[dirs[d] + '.$.opposers'] = { player_name: NAME };

                                    NodeModel.findOne(condition, function (err, doc) {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            if (doc) {
                                                let op = "";
                                                let opp_before = 0;
                                                for (let i of doc[dirs[d]]) {
                                                    if (i.index == to.before) {
                                                        op = i.sup_num <= 1 ? "--" : "-"; // 0/1-1=-1/0;
                                                        opp_before = i.opp_num;
                                                    }
                                                }
                                                let operation = {
                                                    $inc: temp,
                                                    $pull: temp2,
                                                    $push: temp3
                                                };

                                                NodeModel.update(condition, operation, function (err) {
                                                    if (err) {
                                                        console.log(err);
                                                    } else {
                                                        writeAction(NAME, round_id, op, selected, dirs[d], to.before, calcContri(op, opp_before));
                                                        // res.send(op + ' ' + selected + '-' + dirs[d] + '->' + to.before);
                                                        mutualRemove(round_id, to.before, selected, reverseDirs[d], NAME);
                                                    }
                                                });
                                            }
                                        }
                                    });

                                }
                            } else { // Case4: Update(to.before!=to.after!=-1)
                                // - 
                                var to_send = {};
                                let condition = {
                                    round_id: round_id, index: selected
                                };
                                condition[dirs[d] + '.index'] = to.before;
                                let temp = {};
                                temp[dirs[d] + '.$.sup_num'] = -1;
                                temp[dirs[d] + '.$.opp_num'] = 1;
                                let temp2 = {};
                                temp2[dirs[d] + '.$.supporters'] = { player_name: NAME };
                                let temp3 = {};
                                temp3[dirs[d] + '.$.opposers'] = { player_name: NAME };
                                NodeModel.findOne(condition, function (err, doc) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        if (doc) {
                                            let op = "";
                                            let opp_before = 0;
                                            for (let i of doc[dirs[d]]) {
                                                if (i.index == to.before) {
                                                    op = i.sup_num <= 1 ? "--" : "-"; // 0/1-1=-1/0;
                                                    opp_before = i.opp_num;
                                                }
                                            }
                                            let operation = {
                                                $inc: temp,
                                                $pull: temp2,
                                                $push: temp3
                                            };
                                            NodeModel.update(condition, operation, function (err) {
                                                if (err) {
                                                    console.log(err);
                                                } else {
                                                    writeAction(NAME, round_id, op, selected, dirs[d], to.before, calcContri(op, opp_before));
                                                    // res.send(op + ' ' + selected + '-' + dirs[d] + '->' + to.before);
                                                    mutualRemove(round_id, to.before, selected, reverseDirs[d], NAME);
                                                }
                                            });
                                        }
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
                                        temp[dirs[d] + '.$.sup_num'] = isHinted ? hint_weight : 1;
                                        let temp2 = {};
                                        temp2[dirs[d] + '.$.supporters'] = { player_name: NAME };
                                        let temp3 = {};
                                        temp3[dirs[d] + '.$.opposers'] = { player_name: NAME };
                                        let sup_before = i.sup_num;
                                        let operation = {
                                            $inc: temp,
                                            $pull: temp3,
                                            $push: temp2
                                        };
                                        NodeModel.update(condition,
                                            operation,
                                            function (err, doc) {
                                                if (err) {
                                                    console.log(err);
                                                } else {
                                                    writeAction(NAME, round_id, "+", selected, dirs[d], to.after, calcContri("+", sup_before));
                                                    // res.send({msg:'+ ' + selected + '-' + dirs[d] + '->' + to.after});
                                                    mutualAdd(round_id, to.after, selected, reverseDirs[d], isHinted, NAME);
                                                }
                                            });
                                    }
                                }
                                if (!existed) {
                                    // ++
                                    let temp = {};
                                    let support = isHinted ? hint_weight : 1;
                                    temp[dirs[d]] = {
                                        index: to.after,
                                        sup_num: support,
                                        supporters: [{ player_name: NAME }]
                                    };
                                    NodeModel.update(
                                        { round_id: round_id, index: selected },
                                        { $push: temp },
                                        function (err) {
                                            if (err) {
                                                console.log(err);
                                            } else {
                                                writeAction(NAME, round_id, "++", selected, dirs[d], to.after, calcContri("++", 0));
                                                // res.send({msg:'++ ' + selected + '-' + dirs[d] + '->' + to.after});
                                                mutualAdd(round_id, to.after, selected, reverseDirs[d], isHinted, NAME);
                                            }
                                        });
                                }
                            }
                        }
                    }
                }
            }
        });
    }




    /**
     * Get hints from the current graph data
     * @return If sure: an array of recommended index, in 4 directions of the tile
     * @return If unsure: the latest tile that requires more information(highlight in the client to collect votes)
     */
    var strategy = constants.strategy;
    var unsure_gap = constants.unsure_gap;
    router.route('/getHints/:round_id/:selected').all(LoginFirst).get(function (req, res) {
        // router.route('/getHints/:round_id/:selected').get(function (req, res) { // 4 Test
        // query the 4 dirs of the selected tile
        let condition = {
            round_id: req.params.round_id,
            index: req.params.selected
        };
        // find the most-supported one of every dir
        var hintIndexes = new Array();
        var dirs = ['top', 'right', 'bottom', 'left'];

        if (strategy == "conservative") {
            // Stratey1: conservative
            // get the players_num of the round
            RoundModel.findOne({ round_id: req.params.round_id }, { _id: 0, players_num: 1 }, function (err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    if (doc) {
                        let players_num = doc.players_num;
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
                                            // to guarantee zero sup nodes won't be hinted
                                            // 1/5 of the crowd have supported
                                            if (most_sup.sup_num > (players_num / 5)) {
                                                hintIndexes.push(most_sup.index);
                                            } else {
                                                hintIndexes.push(-1);
                                            }
                                        }
                                    }
                                    res.send(JSON.stringify(hintIndexes));
                                }
                            }
                        });
                    }
                }
            });
        } else if (strategy == "aggressive") {
            // Strategy 2: aggressive
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
                                if (most_sup.sup_num > 0) {
                                    hintIndexes.push(most_sup.index);
                                } else {
                                    hintIndexes.push(-1);
                                }
                            }
                        }
                        res.send(JSON.stringify(hintIndexes));
                    }
                }
            });
        } else if (strategy == "considerate") {
            // Strategy 3: considerate
            var unsureLinks = new Array([], [], [], []);
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
                                let best = alternatives[0];
                                let best_score = best.sup_num - best.opp_num;
                                for (let a of alternatives) {
                                    let score = a.sup_num - a.opp_num;
                                    if (score > 0 && score > best_score) {
                                        best = a;
                                        best_score = score;
                                    }
                                }
                                for (let a of alternatives) {
                                    let score = a.sup_num - a.opp_num;
                                    if (score > 0) {
                                        if (score == best_score || score == best_score - unsure_gap) {
                                            unsureLinks[d].push(a.index);
                                        }
                                    }
                                }
                                // if only one best and no best-1
                                if (unsureLinks[d].length == 1) {
                                    hintIndexes.push(unsureLinks[d][0]);
                                    unsureLinks[d] = new Array();
                                } else {
                                    // -2 means multiple choices available
                                    hintIndexes.push(-2);
                                }
                            }
                        }
                        res.send({
                            "sure": JSON.stringify(hintIndexes),
                            "unsure": JSON.stringify(unsureLinks)
                        });
                    }
                }
            });
        } else if (strategy == "contribution") {
            // Strategy 4: Contribution as confidence
            // get the players's contribution in this moment
            RoundModel.findOne({ round_id: req.params.round_id }, { _id: 0, players: 1 }, function (err, doc) {
                if (err) {
                    console.log(err);
                } else {
                    if (doc && doc.players.length > 0) {
                        // doc.players.$.contribution
                        let players=doc.players;
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
                                        } else if (alternatives.length == 1) {
                                            hintIndexes.push(alternatives[0].index);
                                        } else {
                                            // use the first one as the temporary hint
                                            let best = alternatives[0];
                                            let best_confidence = 0;

                                            // compare with others
                                            for (let alt of alternatives) {
                                                let alt_confidence = 0;
                                                // compute the confidence and keep the highest one                                              
                                                for (let supporter of alt.supporters) {
                                                    for (let player of players) {
                                                        if (supporter.player_name == player.player_name) {
                                                            alt_confidence += player.contribution;
                                                        }
                                                    }
                                                }
                                                for (let opposer of alt.opposers) {
                                                    for (let player of players) {
                                                        if (opposer.player_name == player.player_name) {
                                                            alt_confidence -= player.contribution;
                                                        }
                                                    }
                                                }
                                                if (alt_confidence > best_confidence) {
                                                    best = alt;
                                                }
                                            }
                                            hintIndexes.push(best.index);
                                        }
                                    }
                                    res.send(JSON.stringify(hintIndexes));
                                }
                            }
                        });
                    }
                }
            });
        }
    });


    function LoginFirst(req, res, next) {
        if (!req.session.user) {
            req.session.error = 'Please Login First!';
            return res.redirect('/login');
            //return res.redirect('back');//返回之前的页面
        }
        next();
    }

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
                if (doc) {
                    let hasJoined = doc.players.some(function (p) {
                        return (p.player_name == req.session.user.username);
                    });
                    if (!hasJoined) {
                        req.session.error = "You haven't joined this Round!";
                        return res.redirect('/home');
                    }
                    next();
                } else {
                    return res.redirect('/home');
                }
            }
        });
    }
    return router;
}

// module.exports = router;
