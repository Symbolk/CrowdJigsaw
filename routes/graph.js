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
var LinkModel = require('../models/link').Link;
var ActionModel = require('../models/action').Action;

var NAME = "Symbolk";//req.session.name


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


/**
 * Get all the round graph
 */
router.get('/:round_id', function (req, res, next) {
    NodeModel.find({ round_id: req.params.round_id }, function (err, docs) {
        if (err) {
            console.log(err);
        } else {
            res.send(JSON.stringify(docs));
        }
    });
});


/**
 * Init the graph for the round
 */
router.get('/initGraph/:round_id', function (req, res, next) {
    let tiles_num = 64;
    for (let i = 0; i < tiles_num; i++) {
        new NodeModel({
            index: i,
            round_id: req.params.round_id
        }).save(function (err) {
            if (err) {
                console.log(err);
            }
        });
    }
    res.send({ msg: "Graph for Round " + req.params.round_id + "built." });
});


/**
 * Write one action into the action sequence
 */
function writeAction(round_id, operation, from, direction, to) {
    var action = {
        round_id: round_id,
        time_stamp: getNowFormatDate(),
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
router.post('/check', function (req, res, next) {
    let round_id = req.body.round_id;
    let selected = req.body.selectedTile;
    let around = req.body.aroundTiles;
    // For every posted nodes, add them to the nodes(graph), and decide which way 
    NodeModel.findOne({ round_id: round_id, index: selected }, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            var dirs = ['top', 'right', 'bottom', 'left'];
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
                                            writeAction(round_id, "++", selected, dirs[d], to.after);
                                            res.send({ msg: '++ ' + selected + '-' + dirs[d] + '->' + to.after, data: doc });
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
                                                writeAction(round_id, "+", selected, dirs[d], to.after);
                                                res.send({ msg: '+ ' + selected + '-' + dirs[d] + '->' + to.after, data: doc });
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
                                            writeAction(round_id, "++", selected, dirs[d], to.after);
                                            res.send({ msg: '++ ' + selected + '-' + dirs[d] + '->' + to.after, data: doc });
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
                                        writeAction(round_id, op, selected, dirs[d], to.before);                                        
                                        res.send({ msg: op + selected + '-' + dirs[d] + '->' + to.before, data: doc });
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
                                    writeAction(round_id, op, selected, dirs[d], to.before);                                    
                                    to_send["msg1"] = op + selected + '-' + dirs[d] + '->' + to.before;
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
                                            to_send["msg2"] = '+ ' + selected + '-' + dirs[d] + '->' + to.after;
                                            to_send["data"] = doc;
                                            writeAction(round_id, "+", selected, dirs[d], to.after);                                            
                                            res.send(to_send);
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
                                        to_send["msg2"] = '++ ' + selected + '-' + dirs[d] + '->' + to.after;
                                        to_send["data"] = doc;
                                        writeAction(round_id, "++", selected, dirs[d], to.after);                                        
                                        res.send(to_send);
                                    }
                                });
                        }
                    }
                }
            }
        }
    });
});


/**
 * Action sequence
 */


module.exports = router;
