'use strict'

var express = require('express');
var router = express.Router();
var NodeModel = require('../models/node').Node;
var RoundModel = require('../models/round').Round;
var ActionModel = require('../models/action').Action;
var COGModel = require('../models/COG').COG;
var DiffModel = require('../models/diff').Diff;
var util = require('./util.js');
var constants = require('../config/constants');
var dirs = ['top', 'right', 'bottom', 'left'];

const redis = require('redis').createClient();
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
function saveAction(round_id, time, player_name, links_size, logs, is_hint) {
    var action = {
        round_id: round_id,
        time: time,
        player_name: player_name,
        is_hint: is_hint,
        links_size: links_size,
        logs: logs
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
    nodeLink.indexes[y] = {
        "confidence": confidence,
        "weight": weight,
        "edge": edge,
    };
}

function getGAEdges(roundID, nodesAndHints){
    let redis_key = 'round:' + roundID + ':GA_edges';
    redis.get(redis_key, function(err, doc){
        if(doc){
            let GA_edges = JSON.parse(doc);
            nodesAndHints.GA_edges = GA_edges;

            var hints = nodesAndHints.hints;
            for(var edge of GA_edges){
                var sp = edge.split('-');
                var x = parseInt(sp[0].substr(0, sp[0].length - 1));
                var y = parseInt(sp[1].substr(1));
                var tag = sp[1][0] == 'R' ? 'L-R' : 'T-B';
                if(tag == 'L-R'){
                    hints[x][1] = y;
                    hints[y][3] = x;
                }
                else{
                    hints[x][2] = y;
                    hints[y][0] = x;
                }
            }
        }
    });
}

function generateHints(roundID, nodesAndHints){
    var nodes = nodesAndHints.nodes;
    var hints = nodesAndHints.hints;

    var nowTime = (new Date()).getTime();

    var tilesNum = hints.length; 
    var dirName = ['up', 'right', 'bottom', 'left'];
    for (var x = 0; x < tilesNum; x++) {
        for(var d = 0; d < 4; d++){
            hints[x][d] = -1;
            nodes[x][dirName[d]].maxConfidence = 0;
            for(var y in nodes[x][dirName[d]].indexes){
                var confidence = nodes[x][dirName[d]].indexes[y].confidence;
                if(confidence > nodes[x][dirName[d]].maxConfidence){
                    nodes[x][dirName[d]].maxConfidence = confidence;
                    hints[x][d] = Number(y);
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
    var sConfidence = confidence * sLen;
    if(tag == "T-B"){
        if(nodes[x].bottom.indexes[y]) {
            if(confidence < constants.phi || sLen < constants.msn){
                delete nodes[x].bottom.indexes[y];
                delete nodes[y].up.indexes[x];
            }
        }
        if(confidence >= constants.phi && sLen >= constants.msn){
            updateNodesLinks(nodes[x].bottom, x, y, 2, sConfidence, weight, edge, nowTime, hints);
            updateNodesLinks(nodes[y].up, y, x, 0, sConfidence, weight, edge, nowTime, hints);
        }
    }
    else if(tag == "L-R"){
        if(nodes[x].right.indexes[y]) {
            if(confidence < constants.phi || sLen < constants.msn){
                delete nodes[x].right.indexes[y];
                delete nodes[y].left.indexes[x];
            }
        }
        if(confidence >= constants.phi && sLen >= constants.msn){
            updateNodesLinks(nodes[x].right, x, y, 1, sConfidence, weight, edge, nowTime, hints);
            updateNodesLinks(nodes[y].left, y, x, 3, sConfidence, weight, edge, nowTime, hints);
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
                    var confidence = nodes[x][dirName[d]].indexes[y].confidence;
                    if (hints[x][d] != y && confidence >= (nodes[x][dirName[d]].maxConfidence * (1-constants.epsilon))) {
                        unsure = true;
                        var weight = nodes[x][dirName[d]].indexes[y].weight;
                        updateUnsureHints(unsureHints, x, y, d, weight);
                    }
                }
                if(unsure){
                    let y = hints[x][d];
                    let weight = nodes[x][dirName[d]].indexes[y].weight;
                    updateUnsureHints(unsureHints, x, y, d, weight);
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

function computeScore(round_id, round_finish, x, y, tag, size, size_before, beHinted, tilesPerRow, player_name){
    if(round_finish){
        return;
    }
    var correct = false;
    if(tag == 'L-R' && x + 1 == y && y % tilesPerRow != 0){
        correct = true;
    }
    if(tag == 'T-B' && x + tilesPerRow == y){
        correct = true;
    }
    let redis_key = 'round:' + round_id + ':scoreboard';
    var score = 0;
    if(!beHinted && correct && size > 0 && size_before <= 0){
        score = constants.create_correct_link_score;
        redis.zincrby(redis_key + ':create_correct_link', 1, player_name);
    }
    if(!beHinted && correct && size < 0 && size_before >= 0){
        score = constants.remove_correct_link_score;
        redis.zincrby(redis_key + ':remove_correct_link', 1, player_name);
    }
    if(!beHinted && !correct && size > 0 && size_before <= 0){
        score = constants.create_wrong_link_score;
        redis.zincrby(redis_key + ':create_wrong_link', 1, player_name);
    }
    if(!beHinted && !correct && size < 0 && size_before >= 0){
        score = constants.remove_wrong_link_score;
        redis.zincrby(redis_key + ':remove_wrong_link', 1, player_name);
    }
    if(beHinted && !correct && size < 0 && size_before >= 0){
        score = constants.remove_hinted_wrong_link_score;
        redis.zincrby(redis_key + ':remove_hinted_wrong_link', 1, player_name);
    }
    redis.zincrby(redis_key, score, player_name);
}

var averageTime = 0.0;
var updateTimes = 0;
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
                saveAction(roundID, time, data.player_name, data.edges, data.logs, data.is_hint);
                if (doc.edges_saved == undefined || JSON.stringify(doc.edges_saved) == "{}") {
                    // create the edges object & update db directly
                    let edges_saved = {};

                    let nodesAndHints = getNodesAndHints(roundID, doc.tile_num, edges_saved);

                    for (let key in data.edges) {
                        let e = data.edges[key];
                        let supporters = {};
                        let opposers = {};
                        let weight = 0;
                        if (e.size > 0) {
                            supporters[data.player_name] = e.size * (e.beHinted ? constants.decay : 1) * (e.size / e.nodes);
                            weight += supporters[data.player_name];
                        }
                        let confidence = 1;
                        edges_saved[key] = generateEdgeObject(e.x, e.y, e.tag, supporters, opposers, confidence, weight);
                        updateNodesAndEdges(nodesAndHints, edges_saved[key]);
                        computeScore(roundID, (doc.solved_players > 0), e.x, e.y, e.tag, e.size, 0, e.beHinted, doc.tilesPerRow, data.player_name);
                    }
                    
                    generateHints(roundID, nodesAndHints);

                    var COG = computeCOG(roundID, doc.COG, edges_saved, time, doc.tilesPerRow, doc.tilesPerColumn, nodesAndHints);

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
                    for (let key in data.edges) {
                        let e = data.edges[key];
                        // if the edge exists, update the size
                        if (edges_saved.hasOwnProperty(key)) {
                            let supporters = edges_saved[key].supporters;
                            let opposers = edges_saved[key].opposers;
                            if (e.size > 0) {
                                if (supporters.hasOwnProperty(data.player_name)) {
                                    computeScore(roundID, (doc.solved_players > 0), e.x, e.y, e.tag, e.size, supporters[data.player_name], e.beHinted, doc.tilesPerRow, data.player_name);
                                    supporters[data.player_name] = e.size * (e.beHinted ? constants.decay : 1) * (e.size / e.nodes);
                                } else if (opposers.hasOwnProperty(data.player_name)) {
                                    computeScore(roundID, (doc.solved_players > 0), e.x, e.y, e.tag, e.size, opposers[data.player_name], e.beHinted, doc.tilesPerRow, data.player_name);
                                    supporters[data.player_name] = e.size * (e.beHinted ? constants.decay : 1) * (e.size / e.nodes);
                                    delete opposers[data.player_name];
                                } else {
                                    computeScore(roundID, (doc.solved_players > 0), e.x, e.y, e.tag, e.size, 0, e.beHinted, doc.tilesPerRow, data.player_name);
                                    supporters[data.player_name] = e.size * (e.beHinted ? constants.decay : 1) * (e.size / e.nodes);
                                }
                            } else { // e.size<0(e.size==0?)
                                if (supporters.hasOwnProperty(data.player_name)) {
                                    computeScore(roundID, (doc.solved_players > 0), e.x, e.y, e.tag, e.size, supporters[data.player_name], e.beHinted, doc.tilesPerRow, data.player_name);
                                    opposers[data.player_name] = e.size * (e.size / e.nodes);
                                    delete supporters[data.player_name];
                                } else if (opposers.hasOwnProperty(data.player_name)) {
                                    computeScore(roundID, (doc.solved_players > 0), e.x, e.y, e.tag, e.size, opposers[data.player_name], e.beHinted, doc.tilesPerRow, data.player_name);
                                    opposers[data.player_name] = e.size * (e.size / e.nodes);
                                } else {
                                    computeScore(roundID, (doc.solved_players > 0), e.x, e.y, e.tag, e.size, 0, e.beHinted, doc.tilesPerRow, data.player_name);
                                    opposers[data.player_name] = e.size * (e.size / e.nodes);
                                }
                            }
                        } else {
                            // if the edge not exists, create the edge
                            let supporters = {};
                            let opposers = {};
                            let weight = 0;
                            if (e.size > 0) {
                                computeScore(roundID, (doc.solved_players > 0), e.x, e.y, e.tag, e.size, 0, e.beHinted, doc.tilesPerRow, data.player_name);
                                supporters[data.player_name] = e.size * (e.beHinted ? constants.decay : 1) * (e.size / e.nodes);
                                weight += supporters[data.player_name];
                            } else {
                                computeScore(roundID, (doc.solved_players > 0), e.x, e.y, e.tag, e.size, 0, e.beHinted, doc.tilesPerRow, data.player_name);
                                opposers[data.player_name] = e.size * (e.size / e.nodes);
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

                    generateHints(roundID, nodesAndHints);
                    //checkUnsureHints(nodesAndHints);

                    var COG = computeCOG(roundID, doc.COG, edges_saved, time, doc.tilesPerRow, doc.tilesPerColumn, nodesAndHints);

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

function updateForGA(data) {
    // fetch the saved edges data of this round
    let roundID = data.round_id;
    let redis_key = 'round:' + roundID + ':edges_saved';
    redis.get(redis_key, function (err, doc) {
        if (err) {
            console.log(err);
        } else {
            if (doc) {
                let edges_saved = JSON.parse(doc);
                    for (let key in data.edges) {
                        let e = data.edges[key];
                        // if the edge exists, update the size
                        if (edges_saved.hasOwnProperty(key)) {
                            let supporters = edges_saved[key].supporters;
                            let opposers = edges_saved[key].opposers;
                            if (e.size > 0) {
                                if (supporters.hasOwnProperty(data.player_name)) {
                                    supporters[data.player_name] = e.size * (e.beHinted ? constants.decay : 1) * (e.size / e.nodes);
                                } else if (opposers.hasOwnProperty(data.player_name)) {
                                    supporters[data.player_name] = e.size * (e.beHinted ? constants.decay : 1) * (e.size / e.nodes);
                                    delete opposers[data.player_name];
                                } else {
                                    supporters[data.player_name] = e.size * (e.beHinted ? constants.decay : 1) * (e.size / e.nodes);
                                }
                            } else { // e.size<0(e.size==0?)
                                if (supporters.hasOwnProperty(data.player_name)) {
                                    opposers[data.player_name] = e.size * (e.size / e.nodes);
                                    delete supporters[data.player_name];
                                } else if (opposers.hasOwnProperty(data.player_name)) {
                                    opposers[data.player_name] = e.size * (e.size / e.nodes);
                                } else {
                                    opposers[data.player_name] = e.size * (e.size / e.nodes);
                                }
                            }
                        } else {
                            // if the edge not exists, create the edge
                            let supporters = {};
                            let opposers = {};
                            let weight = 0;
                            if (e.size > 0) {
                                supporters[data.player_name] = e.size * (e.beHinted ? constants.decay : 1) * (e.size / e.nodes);
                                weight += supporters[data.player_name];
                            } else {
                                opposers[data.player_name] = e.size * (e.size / e.nodes);
                            }
                            let confidence = 1;
                            edges_saved[key] = generateEdgeObject(e.x, e.y, e.tag, supporters, opposers, confidence, weight);
                        }
                    }
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
                        }
                    }
                    let redis_key = 'round:' + data.round_id + ':edges_saved';
                    redis.set(redis_key, JSON.stringify(edges_saved));
            } else {
                let edges_saved = {};
                for (let key in data.edges) {
                    let e = data.edges[key];
                    let supporters = {};
                    let opposers = {};
                    let weight = 0;
                    if (e.size > 0) {
                        supporters[data.player_name] = e.size * (e.beHinted ? constants.decay : 1) * (e.size / e.nodes);
                        weight += supporters[data.player_name];
                    }
                    let confidence = 1;
                    edges_saved[key] = generateEdgeObject(e.x, e.y, e.tag, supporters, opposers, confidence, weight);
                }
                let redis_key = 'round:' + data.round_id + ':edges_saved';
                redis.set(redis_key, JSON.stringify(edges_saved));    
            }
        }
    });
}

function computeCOG(roundID, COGList, edges_saved, time, tilesPerRow, tilesPerColumn, nodesAndHints){
    if(!COGList){
        COGList = new Array();
    }

    var totalLinks = 2 * tilesPerRow * tilesPerColumn - tilesPerRow -tilesPerColumn;

    var completeLinks = Object.getOwnPropertyNames(edges_saved).length;

    var correctLinks = 0;


    for (e in edges_saved) {
        edge = edges_saved[e];
        if(edge.tag == 'L-R'){
            if(edge.x + 1 == edge.y && edge.y % tilesPerRow != 0){
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

        var correctHints = 0;
        for (var i = 0; i < nodesAndHints.hints.length; i++) {
            var hint = nodesAndHints.hints[i];
            if(i >= tilesPerRow && (i - tilesPerRow) == hint[0]){ //up
                correctHints += 1;
            }
            if(i % tilesPerRow < tilesPerRow - 1 && (i + 1) == hint[1]){ //right
                correctHints += 1;
            }
            if(i < (tilesPerColumn - 1) * tilesPerRow && (i + tilesPerRow) == hint[2]){ //bottom
                correctHints += 1;
            }
            if(i % tilesPerRow > 0 && (i - 1) == hint[3]){ //left
                correctHints += 1;
            }
        }

        var COG = {
            round_id: roundID,
            time: time,
            correctLinks: correctLinks,
            correctHints: correctHints,
            completeLinks: completeLinks,
            totalLinks: totalLinks,
            ga_edges: nodesAndHints.GA_edges,
            nodes: nodesAndHints.nodes,
            hints: nodesAndHints.hints,
            edges_saved: brief_edges_saved,
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

function createDiff(round_id, time, ga_edges, hints){
    for(let edge of ga_edges){
        let sp = edge.split('-');
        let x = parseInt(sp[0].substr(0, sp[0].length - 1));
        let y = parseInt(sp[1].substr(1));
        let tag = sp[1][0] == 'R' ? 'L-R' : 'T-B';
        if(tag == 'L-R'){
            hints[x][1] = y;
            hints[y][3] = x;
        }
        else{
            hints[x][2] = y;
            hints[y][0] = x;
        }
    }
    DiffModel.create({
        round_id: round_id,
        time: time,
        ga_edges: JSON.stringify(ga_edges),
        hints: JSON.stringify(hints)
    }, function (err) {
        if (err) {
            console.log(err);
            return false;
        }
        else {
            return true;
        }
    });
}

module.exports = function (io) {
    io.on('connection', function (socket) {
        socket.on('uploadForGA', function (data) {
            updateForGA(data);
        });
        socket.on('upload', function (data) {
            update(data);
        });
        // request global hints
        socket.on('fetchHints', function (data) {
            var hints = [];
            var unsureHints = {};
            var nodesAndHints = roundNodesAndHints[data.round_id];
            if(nodesAndHints){
                hints = nodesAndHints.hints;
                unsureHints = nodesAndHints.unsureHints;
                let redis_key = 'round:' + data.round_id + ':GA_edges';
                redis.get(redis_key, function(err, doc){
                    if(doc){
                        let GA_edges = JSON.parse(doc);
                        createDiff(data.round_id, Date.now(), GA_edges, hints)
                        nodesAndHints.GA_edges = GA_edges;
                    }
                    socket.emit('proactiveHints', {
                        sureHints: hints,
                        unsureHints: unsureHints
                    });
                });
            }
        });
        // request localhints(around the selected tile)
        socket.on('getHintsAround', function (data) {
            var hints = [];
            var unsureHints = {};
            var nodesAndHints = roundNodesAndHints[data.round_id];
            if(nodesAndHints){
                hints = nodesAndHints.hints;
                unsureHints = nodesAndHints.unsureHints;
                let redis_key = 'round:' + data.round_id + ':GA_edges';
                redis.get(redis_key, function(err, doc){
                    if(doc){
                        let GA_edges = JSON.parse(doc);
                        createDiff(data.round_id, Date.now(), GA_edges, hints)
                        nodesAndHints.GA_edges = GA_edges;
                    }
                    socket.emit('reactiveHints', {
                        indexes: data.indexes,
                        selectedTileIndexes: data.selectedTileIndexes,
                        currentStep: data.currentStep,
                        sureHints: hints,
                        unsureHints: unsureHints
                    });
                });
            }
        });
    });

    function LoginFirst(req, res, next) {
        if (!req.session.user) {
            req.session.error = 'Please Login First!';
            return res.redirect('/login');
            //return res.redirect('back');
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