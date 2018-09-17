'use strict'

var express = require('express');
var router = express.Router();
var NodeModel = require('../models/node').Node;
var RoundModel = require('../models/round').Round;
var ActionModel = require('../models/action').Action;
var COGModel = require('../models/COG').COG;
// var EdgeModel = require('../models/edge').Edge;
var util = require('./util.js');
var constants = require('../config/constants');
var dirs = ['top', 'right', 'bottom', 'left'];

var roundNodesAndHints = {};

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
            contribution = 0.5;
            break;
        case "-":
            contribution = Math.pow(alpha, num_before * 2);
            break;
        default:
            contribution = 0;
    }
    return contribution.toFixed(3);
}

/**
 * Write one action into the action sequence
 */
function saveAction(round_id, time, player_name, links_size) {
    var action = {
        round_id: round_id,
        time: time,
        player_name: player_name,
        links_size: links_size
    }
    ActionModel.create(action, function (err) {
        if (err) {
            console.log(err);
        } 
    });
}

function initNodesAndEdges(roundID, tilesNum){
    var nodesAndHints = {};
    nodesAndHints.nodes = new Array(tilesNum);
    nodesAndHints.hints = new Array(tilesNum);

    for (var i = 0; i < tilesNum; i++) {
        nodesAndHints.nodes[i] = {
            up: {
                indexes: {},
                maxConfidence: 0,
            },
            right: {
                indexes: {},
                maxConfidence: 0,
            },
            bottom: {
                indexes: {},
                maxConfidence: 0,
            },
            left: {
                indexes: {},
                maxConfidence: 0,
            },
        };
        nodesAndHints.hints[i] = new Array(-1, -1, -1, -1);
    }
    roundNodesAndHints[roundID] = nodesAndHints;
}

function getNodesAndHints(roundID, tilesNum, edges_saved){
    let nodesAndHints = roundNodesAndHints[roundID];
    if(!nodesAndHints){
        initNodesAndEdges(roundID, tilesNum);
        nodesAndHints = roundNodesAndHints[roundID];

        for (let e in edges_saved) {
            let edge = edges_saved[e];
            updateNodesAndEdges(nodesAndHints, edge);
        }
    }
    return nodesAndHints;
}

function updateNodesLinks(nodeLink, x, y, dir, confidence, weight, edge, nowTime, hints){
    var createTime = undefined;
    if(nodeLink.indexes[y]){
        if(confidence != nodeLink.indexes[y].confidence){
            createTime = nowTime;
        }
        else{
            createTime = nodeLink.indexes[y].createTime;
        }
    }
    else{
        createTime = nowTime;
    }
    nodeLink.indexes[y] = {
        "confidence": confidence,
        "weight": weight,
        "edge": edge,
        "createTime": createTime
    };
    if(constants.duration == 0 && confidence > nodeLink.maxConfidence){
        nodeLink.maxConfidence = confidence;
        nodeLink.createTime = createTime;
        hints[x][dir] = y;
    }
}

function generateHints(nodesAndHints){
    var nodes = nodesAndHints.nodes;
    var hints = nodesAndHints.hints;

    var nowTime = (new Date()).getTime();

    var tilesNum = hints.length; 
    var dirName = ['up', 'right', 'bottom', 'left'];
    for (var x = 0; x < tilesNum; x++) {
        for(var d = 0; d < 4; d++){
            nodes[x][dirName[d]].maxConfidence = 0;
            for(var y in nodes[x][dirName[d]].indexes){
                if(nowTime - nodes[x][dirName[d]].indexes[y].createTime <= constants.duration){
                    continue;
                }
                var confidence = nodes[x][dirName[d]].indexes[y].confidence;
                if(confidence > nodes[x][dirName[d]].maxConfidence){
                    nodes[x][dirName[d]].maxConfidence = confidence;
                    hints[x][d] = y;
                }
            }
        }
    }
}

function updateNodesAndEdges(nodesAndHints, edge){
    var nodes = nodesAndHints.nodes;
    var hints = nodesAndHints.hints;

    var confidence = edge.confidence;
    var weight = edge.weight;
    var x = Number(edge.x);
    var y = Number(edge.y);
    var tag = edge.tag;
    var supporters = edge.supporters;
    if(!supporters){
        return;
    }
    var nowTime = (new Date()).getTime();
    var sLen = Object.getOwnPropertyNames(supporters).length;
    if(tag == "T-B"){
        if(nodes[x].bottom.indexes[y]) {
            if(confidence < nodes[x].bottom.indexes[y].confidence){
                if(hints[x][2] == y){
                    nodes[x].bottom.maxConfidence = confidence;
                }
                if(hints[y][0] == x){
                    nodes[y].up.maxConfidence = confidence;
                }
            }
            if(confidence < constants.phi || sLen < constants.msn){
                delete nodes[x].bottom.indexes[y];
                delete nodes[y].up.indexes[x];
                if(hints[x][2] == y){
                    hints[x][2] = -1;
                    nodes[x].bottom.maxConfidence = 0;
                }
                if(hints[y][0] == x){
                    hints[y][0] = -1;
                    nodes[x].up.maxConfidence = 0;
                }
            }
        }
        if(confidence >= constants.phi && sLen >= constants.msn){
            updateNodesLinks(nodes[x].bottom, x, y, 2, confidence, weight, edge, nowTime, hints);
            updateNodesLinks(nodes[y].up, y, x, 0, confidence, weight, edge, nowTime, hints);
        }
    }
    else if(tag == "L-R"){
        if(nodes[x].right.indexes[y]) {
            if(confidence < nodes[x].right.indexes[y].confidence){
                if(hints[x][1] == y){
                    nodes[x].right.maxConfidence = confidence;
                }
                if(hints[y][3] == x){
                    nodes[y].left.maxConfidence = confidence;
                }
            }
            if(confidence < constants.phi || sLen < constants.msn){
                delete nodes[x].right.indexes[y];
                delete nodes[y].left.indexes[x];
                if(hints[x][1] == y){
                    hints[x][1] = -1;
                    nodes[x].right.maxConfidence = 0;
                }
                if(hints[y][3] == x){
                    hints[y][3] = -1;
                    nodes[x].right.maxConfidence = 0;
                }
            }
        }
        if(confidence >= constants.phi && sLen >= constants.msn){
            updateNodesLinks(nodes[x].right, x, y, 1, confidence, weight, edge, nowTime, hints);
            updateNodesLinks(nodes[y].left, y, x, 3, confidence, weight, edge, nowTime, hints);
        }
    }
}

function initUnsureHints(unsureHints, index){
    unsureHints[index] = {};
    unsureHints[index].index = index;
    unsureHints[index].aroundTiles = new Array([],[],[],[]);
    unsureHints[index].maxWeight = 0;
    unsureHints[index].weightSum = 0;
}

function updateUnsureHints(unsureHints, x, y, dir, weight){
    if(!unsureHints[x]){
        initUnsureHints(unsureHints, x);
    }
    var fixedWeight = Number(Number(weight).toFixed(3));
    unsureHints[x].aroundTiles[dir].push(Number(y));
    if(fixedWeight > unsureHints[x].maxWeight){
        unsureHints[x].maxWeight = fixedWeight;
    }
    unsureHints[x].weightSum += fixedWeight;
}

function sortUnsureHints(a, b){
    return a.weightSum < b.weightSum;
}

function checkUnsureHints(nodesAndHints){
    var nodes = nodesAndHints.nodes;
    var hints = nodesAndHints.hints;
    var unsureHints = [];
    var nowTime = (new Date()).getTime();
    var tilesNum = hints.length; 
    var dirName = ['up', 'right', 'bottom', 'left'];
    for (var x = 0; x < tilesNum; x++) {
        for (var d = 0; d < 4; d++){
            var unsure = false;
            if(hints[x][d] >= 0){
                for(var y in nodes[x][dirName[d]].indexes){
                    if(nowTime - nodes[x][dirName[d]].indexes[y].createTime <= constants.duration){
                        continue;
                    }
                    var confidence = nodes[x][dirName[d]].indexes[y].confidence;
                    if (hints[x][d] != y && confidence >= (nodes[x][dirName[d]].maxConfidence - constants.epsilon)) {
                        unsure = true;
                        var weight = nodes[x][dirName[d]].indexes[y].weight;
                        updateUnsureHints(unsureHints, x, y, d, weight);
                    }
                }
                if(unsure){
                    let y = hints[x][d];
                    let weight = nodes[x][dirName[d]].indexes[y].weight;
                    updateUnsureHints(unsureHints, x, y, d, weight);
                    nodes[x][dirName[d]].maxConfidence = d;
                    hints[x][d] = -1;
                }
            }
        }
    }
    unsureHints.sort(sortUnsureHints);
    nodesAndHints.unsureHints = unsureHints;
}

function generateEdgeObject(x, y, tag, supporters, opposers, confidence, weight){
    return {
        "x": x,
        "y": y,
        "tag": tag,
        "supporters": supporters,
        "opposers": opposers,
        "confidence": confidence,
        "weight": weight
    };
}

function update(data) {
    // fetch the saved edges data of this round
    let roundID = data.round_id;
    RoundModel.findOne({ round_id: roundID }, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            if (doc) {
                let roundStartTime = Date.parse(doc.start_time);
                let time = (new Date()).getTime() - roundStartTime;
                saveAction(roundID, time, data.player_name, data.edges);
                if (doc.edges_saved == undefined || JSON.stringify(doc.edges_saved) == "{}") {
                    // create the edges object & update db directly
                    let edges_saved = {};

                    let nodesAndHints = getNodesAndHints(roundID, doc.tile_num, edges_saved);

                    for (let e of data.edges) {
                        let key = e.x + e.tag + e.y;
                        let supporters = {};
                        let opposers = {};
                        let weight = 0;
                        if (e.size > 0) {
                            supporters[data.player_name] = e.size * (e.beHinted ? constants.decay : 1);
                            weight += supporters[data.player_name];
                        }
                        let confidence = 1;
                        edges_saved[key] = generateEdgeObject(e.x, e.y, e.tag, supporters, opposers, confidence, weight);
                        updateNodesAndEdges(nodesAndHints, edges_saved[key]);
                    }
                    if(constants.duration > 0){
                        generateHints(nodesAndHints);
                    }
                    var COG = computeCOG(roundID, doc.COG, edges_saved, time, doc.tilesPerRow, doc.tilesPerColumn);

                    RoundModel.update({ round_id: data.round_id }, 
                        { $set: { edges_saved: edges_saved, contribution: computeContribution(nodesAndHints), COG: COG  }}, function (err) {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log("First blood!");
                        }
                    });
                } else {
                    // get and update the object, then update db once
                    let edges_saved = doc.edges_saved;
                    for (let e of data.edges) {
                        let temp = e.x + e.tag + e.y;
                        // if the edge exists, update the size
                        if (edges_saved.hasOwnProperty(temp)) {
                            let supporters = edges_saved[temp].supporters;
                            let opposers = edges_saved[temp].opposers;
                            if (e.size > 0) {
                                if (supporters.hasOwnProperty(data.player_name)) {
                                    supporters[data.player_name] = e.size * (e.beHinted ? constants.decay : 1);
                                } else if (opposers.hasOwnProperty(data.player_name)) {
                                    supporters[data.player_name] = e.size * (e.beHinted ? constants.decay : 1);
                                    delete opposers[data.player_name];
                                } else {
                                    supporters[data.player_name] = e.size * (e.beHinted ? constants.decay : 1);
                                }
                            } else { // e.size<0(e.size==0?)
                                if (supporters.hasOwnProperty(data.player_name)) {
                                    opposers[data.player_name] = 0 - e.size;
                                    delete supporters[data.player_name];
                                } else if (opposers.hasOwnProperty(data.player_name)) {
                                    opposers[data.player_name] = 0 - e.size;
                                } else {
                                    opposers[data.player_name] = 0 - e.size;
                                }
                            }
                        } else {
                            // if the edge not exists, create the edge
                            let key = e.x + e.tag + e.y;
                            let supporters = {};
                            let opposers = {};
                            let weight = 0;
                            if (e.size > 0) {
                                supporters[data.player_name] = e.size * (e.beHinted ? constants.decay : 1);
                                weight += supporters[data.player_name];
                            } else {
                                opposers[data.player_name] = 0 - e.size;
                            }
                            let confidence = 1;
                            edges_saved[key] = generateEdgeObject(e.x, e.y, e.tag, supporters, opposers, confidence, weight);
                        }
                    }

                    let nodesAndHints = getNodesAndHints(roundID, doc.tile_num, edges_saved);

                    // update the confidence of every saved edge
                    for (let e in edges_saved) {
                        let oldConfidence = edges_saved[e].confidence;
                        let oldWeight = edges_saved[e].weight;
                        let supporters = edges_saved[e].supporters;
                        let opposers = edges_saved[e].opposers;
                        let wp = 0;
                        let wn = 0;
                        for (let s in supporters) {
                            wp += supporters[s];
                        }
                        for (let o in opposers) {
                            wn += opposers[o];
                        }
                        edges_saved[e].weight = wp;
                        if (wp + wn != 0) {
                            edges_saved[e].confidence = wp / (wp + wn);
                            if(edges_saved[e].confidence < oldConfidence){
                                updateNodesAndEdges(nodesAndHints, edges_saved[e]);
                            }
                        }
                    }

                    for (let e in edges_saved) {
                        updateNodesAndEdges(nodesAndHints, edges_saved[e]);
                    }
                    if(constants.duration > 0){
                        generateHints(nodesAndHints);
                    }
                    checkUnsureHints(nodesAndHints);

                    var COG = computeCOG(roundID, doc.COG, edges_saved, time, doc.tilesPerRow, doc.tilesPerColumn);

                    RoundModel.update({ round_id: data.round_id }, 
                        { $set: { edges_saved: edges_saved, contribution: computeContribution(nodesAndHints), COG: COG } }, function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                }
            }
        }
    });
}

function computeCOG(roundID, COGList, edges_saved, time, tilesPerRow, tilesPerColumn){
    if(!COGList){
        COGList = new Array();
    }

    var totalLinks = 2 * tilesPerRow * tilesPerColumn - tilesPerRow -tilesPerColumn;

    var completeLinks = Object.getOwnPropertyNames(edges_saved).length;

    var correctLinks = 0;


    for (e in edges_saved) {
        edge = edges_saved[e];
        if(edge.tag == 'L-R'){
            if(edge.x + 1 == edge.y){
                correctLinks += 1;
            }
        }
        else{
            if(edge.x + tilesPerColumn == edge.y){
                correctLinks += 1;
            }
        }
    }

    var COGchanged = true;
    var preTime = 0;
    if(COGList.length > 0){
        var preCOG = COGList[COGList.length - 1];
        preTime = preCOG.time;
        if(preCOG.correctLinks == correctLinks && preCOG.completeLinks == completeLinks){
            COGchanged = false;
        }
    }

    var brief_edges_saved = {};
    for (var e in edges_saved) {
        var edge = edges_saved[e];
        var supporters = edge.supporters;
        var opposers = edge.opposers;
        var sLen = Object.getOwnPropertyNames(supporters).length;
        var oLen = Object.getOwnPropertyNames(opposers).length;
        var wp = edge.weight;
        var confidence = edge.confidence;
        var wn = 0;
        if(confidence > 0){
            wn = wp / confidence - wp;
        }
        else{
            for (var o in opposers) {
                wn += opposers[o];
            }
        }
        wp = Number(wp).toFixed(2);
        wn = Number(wn).toFixed(2);
        brief_edges_saved[e] = {
            wp: wp,
            wn: wn,
            sLen: sLen,
            oLen: oLen
        }
    }

    if(COGchanged){
        var currentCOG = {
            time: time,
            correctLinks: correctLinks,
            completeLinks: completeLinks,
            totalLinks: totalLinks,
        };
        COGList.push(currentCOG);

        var COG = {
            round_id: roundID,
            time: time,
            correctLinks: correctLinks,
            completeLinks: completeLinks,
            totalLinks: totalLinks,
            edges_changed: brief_edges_saved,
        }
        COGModel.create(COG, function (err) {
            if (err) {
                console.log(err);
                return false;
            } else {
                return true;
            }
        });
        //console.log(COGList.length, COGList);
    }
    return COGList;
}

function computeContribution(nodesAndHints){
    var nodes = nodesAndHints.nodes;
    var hints = nodesAndHints.hints;

    var hintsCount = 0;

    var contibutionMap = {};
    for (var x = 0; x < hints.length; x++) {
        for(var d = 0; d < 4; d++){
            var direction = undefined;
            switch(d){
                case 0: direction = 'up'; break;
                case 1: direction = 'right'; break;
                case 2: direction = 'bottom'; break;
                case 3: direction = 'left'; break;
                default: break;
            }
            if(hints[x][d] >= 0 && nodes[x][direction]){
                hintsCount += 1;
                var y = hints[x][d];
                var edge = nodes[x][direction].indexes[y].edge;
                var weight = edge.weight;
                var supporters = edge.supporters;
                for (var s in supporters) {
                    var contribution = supporters[s] / weight;
                    if(!contibutionMap[s]){
                        contibutionMap[s] = 0;
                    }
                    contibutionMap[s] += contribution;
                }
            }
        }
    }

    var sum = 0;
    var latestPlayer = undefined;
    for(var p in contibutionMap){
        contibutionMap[p] /= hintsCount;
        contibutionMap[p] = Number(Number(contibutionMap[p]).toFixed(5));
        sum += contibutionMap[p];
        latestPlayer = p;
    }
    if(latestPlayer){
        contibutionMap[latestPlayer] += 1 - sum;
    }

    return contibutionMap;
}


module.exports = function (io) {
    io.on('connection', function (socket) {
        socket.on('upload', function (data) {
            // check(data);
            update(data);
        });
        // request global hints
        socket.on('fetchHints', function (data) {
            // console.log(data.player_name + " is asking for help...");
            if(roundNodesAndHints[data.round_id]){
                if(constants.duration > 0){
                    generateHints(roundNodesAndHints[data.round_id]);
                    checkUnsureHints(roundNodesAndHints[data.round_id]);
                }
                socket.emit('proactiveHints', { 
                    sureHints: roundNodesAndHints[data.round_id].hints,
                    unsureHints: roundNodesAndHints[data.round_id].unsureHints
                });
            }
            else{ 
                socket.emit('proactiveHints', {});
            }
        });
        // request localhints(around the selected tile)
        socket.on('getHintsAround', function (data) {
            var hints = [];
            var unsureHints = {};
            if(roundNodesAndHints[data.round_id]){
                if(constants.duration > 0){
                    generateHints(roundNodesAndHints[data.round_id]);
                    checkUnsureHints(roundNodesAndHints[data.round_id]);
                }
                hints = roundNodesAndHints[data.round_id].hints;
                unsureHints = roundNodesAndHints[data.round_id].unsureHints;
            }
            socket.emit('reactiveHints', {
                indexes: data.indexes,
                selectedTileIndexes: data.selectedTileIndexes,
                currentStep: data.currentStep,
                sureHints: hints,
                unsureHints: unsureHints
            });
        });
    });

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
                        let players = doc.players;
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