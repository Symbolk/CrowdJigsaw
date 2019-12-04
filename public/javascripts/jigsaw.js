var requrl = window.location.protocol + '//' + window.location.host + '/';
var loadReady = false;
var socket = io.connect(requrl);

var moveAnimationTime = 15;
var uploadDelayTime = algorithm == 'distribute'? 5: 5;


var undoStep = -1;
$('#undo_button').css('display', 'none');

$(document).ready(function () {
    loadReady = true;
});

if (roundID < 0) {
    $('#help_button').css('display', 'none');
    $('#guess_button').css('display', 'none');
    $('#share_button').css('display', 'none');
}

$('#share_info input').change(function () {
    if ($('#share_info_no').prop("checked")) {
        $('#share_info_reason_wraper').css('display', 'block');
    }
    else {
        $('#share_info_reason_wraper').css('display', 'none');
    }
});

$('#next_game input').change(function () {
    if ($('#next_game_no').prop("checked")) {
        $('#next_game_reason_wraper').css('display', 'block');
    }
    else {
        $('#next_game_reason_wraper').css('display', 'none');
    }
});

$('#next_game2 input').change(function () {
    if ($('#next_game_no2').prop("checked")) {
        $('#next_game_reason_wraper2').css('display', 'block');
    }
    else {
        $('#next_game_reason_wraper2').css('display', 'none');
    }
});


var hintedLinksNum = undefined;
var totalHintsNum = 0;
var correctHintsNum = 0;

// document.querySelector('#show_steps').addEventListener('click', function () {
//     $('#steps').fadeToggle('slow');
// });
// document.querySelector('#show_timer').addEventListener('click', function () {
//     $('#timer').fadeToggle('slow');
// });

/*
* Jigsaw functions
*/
Array.prototype.remove = function (start, end) {
    this.splice(start, end);
    return this;
}

view.currentScroll = new Point(0, 0);
var scrollVector = new Point(0, 0);
var scrollMargin = 32;
$('#puzzle-image').attr('src', imgSrc);

var imgWidth = $('.puzzle-image').css('width').replace('px', '');
var imgHeight = $('.puzzle-image').css('height').replace('px', '');

if (level == 3) {
    tileWidth = 32;
}
if (level == 4) {
    imgWidth = 1024;
    imgHeight = 1024;
}

var config = ({
    zoomScaleOnDrag: 1.25,
    imgName: 'puzzle-image',
    tileShape: 'straight', // curved or straight or voronoi
    tileWidth: tileWidth,
    showHints: true,
    shadowWidth: 120,
    dragMode: 'tile-First',// tile-First or group-First
    allowOverlap: false //whether allows overLap
});

var directions = [
    new Point(0, -1),
    new Point(1, 0),
    new Point(0, 1),
    new Point(-1, 0)
];

var resetplaceDirctions = [
    new Point(0, -1),
    new Point(1, 0),
    new Point(0, 1),
    new Point(-1, 0),
    new Point(-1,-1),
    new Point(1,-1),
    new Point(-1,1),
    new Point(1,1)
];

var oppositiveEdges = [2, 3, 0, 1]; // 0(up)<->2(bottom), 1(right)<->3(left) 
/**
 * Start building the puzzle
 */
if (roundShape == 'square') {
    config.tileShape = 'straight';
}
else {
    config.tileShape = 'curved';
}

if (level == 1) {
    config.level = 1;
    //config others here
} else if (level == 2) {
    config.level = 2;
    //config others here    
}

var puzzle = new JigsawPuzzle(config);
/Android|webOS|iPhone|iPod|BlackBerry/i.test(navigator.userAgent) ? puzzle.zoom(-0.5) : puzzle.zoom(-0.1);
var time = 0;
var t;
//var startTime = (new Date()).getTime(); //compute from when the user ready
var startTime = serverStartTime; //compute from when the round start at server-side
function timedCount() {
    var realtime = Math.floor(((new Date()).getTime() - startTime) / 1000);
    if (realtime > time) {
        time = realtime;
    }
    var hours = Math.floor(time / 3600);
    var minutes = Math.floor((time - hours * 3600) / 60);
    var seconds = time - hours * 3600 - minutes * 60;
    if (hours >= 0 && hours <= 9) hours = '0' + hours;
    if (minutes >= 0 && minutes <= 9) minutes = '0' + minutes;
    if (seconds >= 0 && seconds <= 9) seconds = '0' + seconds;
    document.getElementById('timer').innerHTML = hours + ":" + minutes + ":" + seconds;
    t = setTimeout(timedCount, 1000);
}

if (puzzle)
    timedCount();

// $('#myselect').change(function () {
//     if (puzzle) {
//         if (this.value == "DragTileFirst") {
//             puzzle.dragMode = "tile-First";
//         }
//         else {
//             puzzle.dragMode = "group-First";
//         }
//     }
// });


var path;
var movePath = false;

$('.puzzle-image').css('margin', '-' + imgHeight / 2 + 'px 0 0 -' + imgWidth / 2 + 'px');


var ctrlFrame, ctrlFrameFrom, ctrlFrameTo;
var downTime, alreadyDragged, dragTime, draggingGroup;
var mousedowned = false;
var timeoutFunction;
function onMouseDown(event) {
    mousedowned = true;
    var tilesCount = puzzle.pickTile(event.point, (event.event.ctrlKey || event.event.metaKey));
    if (tilesCount > 0 && !(event.event.ctrlKey || event.event.metaKey)) {
        timeoutFunction = setTimeout(puzzle.dragTileOrTiles, 500);
    }
    if (ctrlFrame) {
        ctrlFrame.remove();
        ctrlFrame = null;
    }
    if(tilesCount == 0 && (event.event.ctrlKey || event.event.metaKey)){
        ctrlFrameFrom = event.point;
        ctrlFrameTo = event.point;
    }
}

function onFrame(event) {
    // Each frame, rotate the path by 3 degrees:
    puzzle.animation();
}

function onMouseUp(event) {
    if (timeoutFunction) {
        clearTimeout(timeoutFunction);
    }

    if(!(event.event.ctrlKey || event.event.metaKey) || puzzle.ctrlDrag) {
        puzzle.releaseTile();
    }
    mousedowned = false;
    if (ctrlFrame) {
        if(ctrlFrameFrom && ctrlFrameTo && (event.event.ctrlKey || event.event.metaKey) && !puzzle.ctrlDrag) {
            puzzle.pickTileFromTo(ctrlFrameFrom, ctrlFrameTo);
        }
        ctrlFrame.remove();
        ctrlFrame = null;
        ctrlFrameFrom = null;
        ctrlFrameTo = null;
    }
}


function onMouseDrag(event) {
    mousedowned = true;
    if (timeoutFunction) {
        clearTimeout(timeoutFunction);
    }
    puzzle.dragTile(event.delta, (event.event.ctrlKey || event.event.metaKey));
    if (ctrlFrame) {
        ctrlFrame.remove();
        ctrlFrame = null;
    }
    if (!puzzle.ctrlDrag && ctrlFrameTo && (event.event.ctrlKey || event.event.metaKey)) {
        ctrlFrameTo += event.delta;
        ctrlFrame = new Shape.Rectangle(ctrlFrameFrom, ctrlFrameTo);
        ctrlFrame.strokeColor = 'black';
    }
}

$(window).bind('mousewheel', function (e) {
    if (e.originalEvent.wheelDelta > 0) {
        puzzle.zoom(.1);
    }
    else {
        puzzle.zoom(-.1);
    }
});

var ctrlDown = false;
function onKeyDown(event) {
    switch (event.key) {
        case 'z':
            if ((event.event.ctrlKey || event.event.metaKey)) {
                // undo a step
                if (puzzle.steps != undoStep) {
                    puzzle.undoNextStep();
                }
            }
            break;
        case 'control':
            ctrlDown = true;
            break;
    }
}

function onKeyUp(event) {
    switch (event.key) {
        case 'z':
            if (!(event.event.ctrlKey || event.event.metaKey)) {
                puzzle.zoom(.1);
            }
            break;
        case 'x':
            puzzle.zoom(-.1);
            break;
        case 'control':
            if (ctrlFrame) {
                ctrlFrame.remove();
                ctrlFrame = null;
            }
            if (puzzle.selectedTile) {
                puzzle.releaseTile();
            }
            ctrlDown = false;
            break;
    }
}

function getOriginImage(config) {
    var raster = undefined;
    if (config.level == 4) {
        var path = new Path.Rectangle(new Point(0, 0), new Size(config.imgWidth, config.imgHeight));
        path.fillColor = config.imgName;
        raster = path.rasterize();
        path.remove();
    }
    else {
        raster = new Raster(config.imgName);
        raster.setSize(imageWidth, imageHeight);
    }
    return raster;
}

function JigsawPuzzle(config) {
    var instance = this; // the current object(which calls the function)
    socket.on('someoneSolved', function (data) {
        if (data.round_id == roundID) {
            $.amaran({
                'title': 'someoneSolved',
                'message': 'Someone has solved the puzzle!',
                'inEffect': 'slideRight',
                'cssanimationOut': 'zoomOutUp',
                'position': "top right",
                'delay': 3000,
                'closeOnClick': true,
                'closeButton': true
            });
        }
    });

    this.forceLeaving = false;
    this.forceLeave = function(text)
    {

        if (forceLeaveEnable === 'false') {
            return;
        }
        if (!instance.forceLeaving) {
            sendRecord(false, 5);
        }

        instance.forceLeaving = true;
        
        $('#cancel-button').attr('disabled',"true");

        $('#quitLabel').text(text);
        $('#ensure_quit_dialog').modal({
            keyboard: true,
        });
    }

    socket.on('forceLeave', function (data) {
        if (data.round_id == roundID) {
            instance.forceLeave('More than 3 Players Have Finished the Puzzle. Send record.');
        }
    });

    socket.on('gameSaved', function (data) {
        if (data.success == true && data.round_id == roundID && data.player_name == player_name) {
        }
    });

    socket.on('roundChanged', function (data) {
        if (data.username == player_name && data.round_id == roundID) {
            $('.rating-body').css('display', 'inline');
            $('#apply-button').removeAttr('disabled');
            $('#submit-button').removeAttr('disabled');
            $('#cancel-button').removeAttr('disabled');
            if(data.action == "quit"){
                if(players_num == 1){
                    window.location = '/home';
                }
                else{
                    window.location = '/award/' + roundID;
                }
            }
        }
    });

    socket.on('roundPlayersChanged', function (data) {
        if (data.username == player_name && data.round_id == roundID) {
            $('.rating-body').css('display', 'inline');
            $('#apply-button').removeAttr('disabled');
            $('#submit-button').removeAttr('disabled');
            $('#cancel-button').removeAttr('disabled');
            if(data.action == "quit"){
                if(players_num == 1){
                    window.location = '/home';
                }
                else{
                    window.location = '/award/' + roundID;
                }
            }
        }
    });


    this.tileShape = config.tileShape;
    this.level = config.level;

    this.currentZoom = 1;
    this.zoomScaleOnDrag = config.zoomScaleOnDrag;
    this.imgName = config.imgName;
    this.shadowWidth = config.shadowWidth;
    this.tileWidth = config.tileWidth;
    this.originImage = getOriginImage(config);
    this.imgSize = this.originImage.size;
    this.imgWidth = imageWidth;
    this.imgHeight = imageHeight;
    this.tilesPerRow = tilesPerRow;
    this.tilesPerColumn = tilesPerColumn;
    this.puzzleImage = this.originImage.getSubRaster(new Rectangle(0, 0, this.tilesPerRow * this.tileWidth, this.tilesPerColumn * this.tileWidth));
    this.puzzleImage.size *= Math.max((this.tileWidth / 2) / this.puzzleImage.size.width,
        (this.tileWidth / 2) / this.puzzleImage.size.height) + 1
    this.puzzleImage.position = view.center;
    this.originImage.visible = false;
    this.puzzleImage.visible = false;

    this.dragMode = config.dragMode;

    this.showHints = config.showHints;

    this.tilesNum = this.tilesPerRow * this.tilesPerColumn;

    if (this.tileShape == "voronoi") {
        this.tileMarginWidth = this.tileWidth * 0.5;
    }
    else {
        this.tileMarginWidth = this.tileWidth * ((100 / this.tileWidth - 1) / 2);
    }
    this.selectedTile = null;
    this.selectedGroup = undefined;

    this.saveShapeArray = shapeArray;
    this.saveTilePositions = undefined;
    this.saveHintedLinks = undefined;
    this.saveLinkSteps = undefined;
    this.saveLinksFrom = undefined;
    this.shapeArray = undefined;
    this.tiles = undefined;
    this.edgesKept = undefined;
    this.edgesDropped = undefined;
    this.groups = undefined; // a connected subgraph as a group
    this.sizes = undefined; // number of edges as the size
    this.askHelpTimeout = undefined; // time past since last action
    this.lastStepTime = 0;
    this.thisStepTime = 0;
    this.linksChangedCount = 0;

    this.dfsGraphLinksMap = new Array();
    this.subGraphData = new Array();
    this.removeLinksData = new Array();
    this.subGraphNodesCount = 0;

    this.hintsShowing = false;
    this.undoing = false;
    this.draging = false;

    this.shadowScale = 1.5;

    this.steps = 0;
    this.realSteps = 0;
    this.realStepsCounted = false;

    this.gameStarted = false;

    this.allowOverlap = config.allowOverlap;

    this.gameFinished = false;

    this.maxSubGraphSize = 0;

    this.unsureHintsColor = ["red", "purple"];
    this.colorBorderWidth = 10;

    this.hintedTilesMap = new Array();

    this.hintAroundTilesMap = new Array();

    this.getHintsArray = new Array();

    this.hintsLog = {};
    this.hintsConflict = new Set();
    this.conflictEdgesTimesMap = {};

    this.subGraphDataQueue = new Array();

    this.conflictGroupHasBeenMoveAway = false;

    this.shareInfoToggle = false;

    $.amaran({
        'title': 'startRound',
        'message': 'Round ' + roundID + ': ' + this.tilesPerRow + ' * ' + this.tilesPerColumn,
        'inEffect': 'slideRight',
        'cssanimationOut': 'zoomOutUp',
        'position': "top right",
        'delay': 2000,
        'closeOnClick': true,
        'closeButton': true
    });
    console.log('Round ' + roundID + ': ' + this.tilesPerRow + ' * ' + this.tilesPerColumn);

    if (roundID >= 0) {
        loadGame();
    }
    else {
        createAndPlaceTiles(true);
    }

    this.gameCreated = false;
    function createAndPlaceTiles(needIntro) {
        if (instance.gameCreated) {
            return;
        }
        instance.gameCreated = true;
        if (instance.tileShape == "voronoi") {
            instance.tiles = createVoronoiTiles(instance.tilesPerRow, instance.tilesPerColumn);
        }
        else {
            instance.tiles = createTiles(instance.tilesPerRow, instance.tilesPerColumn);
        }
        randomPlaceTiles(instance.tilesPerRow, instance.tilesPerColumn);
        instance.edgesKept = new Array();
        instance.edgesDropped = new Array();
        instance.groups = new Array();
        instance.sizes = new Array();

        for (var i = 0; i < instance.tiles.length; i++) {
            var tile = instance.tiles[i];
            refreshAroundTiles(tile, false);
            tile.aroundTilesChanged = false;
            tile.preStep = instance.step - 2;
            tile.preCellPosition = tile.cellPosition;
            if (!tile.subGraphSize) {
                tile.subGraphSize = 0;
                tile.nodesCount = 1;
            }
            instance.groups[i] = i;
            instance.sizes[i] = 0;
        }

        if (instance.saveHintedLinks) {
            for (var i = 0; i < instance.saveHintedLinks.length; i++) {
                var tile = instance.tiles[i];
                tile.hintedLinks = instance.saveHintedLinks[i];
            }
        }

        if (instance.saveLinksFrom) {
            for (var i = 0; i < instance.saveLinksFrom.length; i++) {
                var tile = instance.tiles[i];
                tile.linksFrom = instance.saveLinksFrom[i];
            }
        }

        if (instance.saveLinkSteps) {
            for (var i = 0; i < instance.saveLinkSteps.length; i++) {
                var tile = instance.tiles[i];
                tile.linkSteps = instance.saveLinkSteps[i];
            }
        }

        for (var i = 0; i < instance.tiles.length; i++) {
            var tile = instance.tiles[i];
            computeSubGraph(tile);
        }
        computeGraphData();


        if (!instance.saveTilePositions) {
            saveGame();
            if (players_num > 0) {
                $('#pregame_survey').modal({
                    keyboard: false,
                    backdrop: 'static',
                });
            }
        }
        else {
            if (!instance.gameFinished) {
                var errors = checkTiles();
                if (errors == 0) {
                    finishGame();
                }
            }
        }

        normalizeTiles();

        if (instance.shareInfoToggle) {
            $('#share_button').css('display', 'none');
        }

        instance.gameStarted = true;
        instance.focusToCenter();
        var canvasLayer = document.getElementById("canvas");
        canvasLayer.style.background = "#dddddd";
        var background = new Shape.Rectangle({
            rectangle: new Rectangle(0, 0, 63 * tileWidth, 63 * tileWidth),
            fillColor: 'white'
        });
        background.sendToBack();
        $("#loading").fadeOut();
    }

    function refreshAroundTiles(tile, beHinted) {
        var tileIndex = getTileIndex(tile);

        var cellPosition = tile.cellPosition;

        var topTile = getTileAtCellPosition(cellPosition + new Point(0, -1));
        var rightTile = getTileAtCellPosition(cellPosition + new Point(1, 0));
        var bottomTile = getTileAtCellPosition(cellPosition + new Point(0, 1));
        var leftTile = getTileAtCellPosition(cellPosition + new Point(-1, 0));

        var aroundTiles = new Array(getTileIndex(topTile), getTileIndex(rightTile),
            getTileIndex(bottomTile), getTileIndex(leftTile));

        var aroundTilesChanged = false;

        if (!tile.aroundTiles) {
            tile.aroundTiles = new Array(-1, -1, -1, -1);
        }

        for (var i = 0; i < aroundTiles.length; i++) {
            if (!beHinted) {
                if (aroundTiles[i] == -1 && tile.aroundTiles[i] != -1) { // add conflict record to both tile connected before
                    tile.conflictTiles[tile.aroundTiles[i]] = true;
                    var neighborTile = instance.tiles[tile.aroundTiles[i]];
                    neighborTile.conflictTiles[tileIndex] = true;
                }

                if (tile.aroundTiles[i] == -1 && aroundTiles[i] != -1) { // remove conflict record to both tile
                    tile.conflictTiles[aroundTiles[i]] = false;
                    var neighborTile = instance.tiles[aroundTiles[i]];
                    neighborTile.conflictTiles[tileIndex] = false;
                }

                if (tile.hintedLinks[i] >= 0) {
                    tile.hintedLinks[i] = Math.floor(tile.hintedLinks[i]) + 0.5;
                }
            }

            if (tile.aroundTiles[i] != aroundTiles[i]) {
                aroundTilesChanged = true;
                if (aroundTiles[i] >= 0) {
                    instance.createSomeLinks = true;
                }
                if (beHinted) {
                    if (aroundTiles[i] >= 0) {
                        tile.hintedLinks[i] = aroundTiles[i];
                        if (instance.hintedFrom) {
                            tile.linksFrom[i] = instance.hintedFrom;
                        }
                    }
                } else {
                    instance.linksChangedCount += 1;
                    if (tile.hintedLinks[i] >= 0) {
                        tile.hintedLinks[i] = Math.floor(tile.hintedLinks[i]) + 0.5;
                    }
                }
            }
        }
        if (aroundTilesChanged) {
            if (instance.gameStarted && !instance.realStepsCounted) {
                instance.realSteps += 1;
                document.getElementById("steps").innerHTML = instance.realSteps;

                instance.lastStepTime = instance.thisStepTime;
                instance.thisStepTime = time;
                //clearTimeout(instance.askHelpTimeout);
                var delta = Number(instance.thisStepTime - instance.lastStepTime);
                if (delta >= 2 && instance.linksChangedCount >= 0) {
                    instance.linksChangedCount = 0;
                    //instance.askHelpTimeout = setTimeout(askHelp, 5000 * delta);
                }
                
                instance.realStepsCounted = true;
            }

            tile.oldAroundTiles = tile.aroundTiles;
            tile.aroundTiles = aroundTiles;
            tile.aroundTilesChanged = aroundTilesChanged;

            var sum = 0;
            var allLinksHinted = true;
            var allAroundByTiles = true;
            for (var i = 0; i < tile.aroundTiles.length; i++) {
                sum += tile.aroundTiles[i];
                if (tile.aroundTiles[i] < 0) {
                    allAroundByTiles = false;
                }
                if (tile.aroundTiles[i] >= 0 && tile.hintedLinks[i] != tile.aroundTiles[i]) {
                    allLinksHinted = false;
                }

                if (tile.aroundTiles[i] != tile.oldAroundTiles[i]) {
                    tile.linkSteps[i] = instance.realSteps;
                    if (tile.oldAroundTiles[i] >= 0) {
                        var neighborTile = instance.tiles[tile.oldAroundTiles[i]];
                        refreshAroundTiles(neighborTile, beHinted);
                    }
                    if (tile.aroundTiles[i] >= 0) {
                        var neighborTile = instance.tiles[tile.aroundTiles[i]];
                        refreshAroundTiles(neighborTile, beHinted);
                    }
                }
            }
            if (sum == -4) {
                tile.noAroundTiles = true;
                tile.allLinksHinted = false;
            }
            else {
                tile.noAroundTiles = false;
                tile.allLinksHinted = allLinksHinted;
            }
            tile.allAroundByTiles = allAroundByTiles;
        }

        if (!tile.oldAroundTiles) {
            tile.oldAroundTiles = new Array(-1, -1, -1, -1);
        }
    }

    this.focusToCenter = function () {
        if (instance.currentZoom > 0.9) {
            instance.currentZoom = 1;
            /Android|webOS|iPhone|iPod|BlackBerry/i.test(navigator.userAgent) ? instance.zoom(-0.5) : instance.zoom(-0.1);
        }
        for (var i = 0; i < 10; i++) {
            view.scrollBy(instance.centerPoint - view.center / 1 + new Point(window.innerWidth / 3.5, window.innerHeight / 20));
        }
    }

    this.calcHintedTile = function () {
        hintedLinksNum = {
            totalLinks: 0,
            normalLinks: 0,
            hintedLinks: 0,
            correctLinks: 0,
            totalSteps: 0,
            hintedSteps: 0
        };
        if(!instance.tiles){
            return;
        }
        totalStepsMap = new Map();
        hintedStepsMap = new Map();
        for (var i = 0; i < instance.tiles.length; i++) {
            var tile = instance.tiles[i];
            for (var j = 0; j < tile.hintedLinks.length; j++) {
                if (tile.aroundTiles[j] >= 0) {
                    var correctIndex = i + directions[j].x + directions[j].y * instance.tilesPerRow;
                    if(tile.aroundTiles[j] == correctIndex){
                        hintedLinksNum.correctLinks += 1;
                    }
                    if (tile.hintedLinks[j] >= 0 && Math.floor(tile.hintedLinks[j]) == tile.aroundTiles[j]) {
                        hintedLinksNum.hintedLinks += 1;
                        hintedStepsMap.set(tile.linkSteps[j], 1);
                    }
                    else {
                        hintedLinksNum.normalLinks += 1;
                    }
                    totalStepsMap.set(tile.linkSteps[j], 1);
                    hintedLinksNum.totalLinks += 1;
                }
            }
        }
        hintedLinksNum.hintedSteps = hintedStepsMap.size;
        hintedLinksNum.totalSteps = totalStepsMap.size;
    }

    function finishGame() {
        instance.gameFinished = true;

        clearTimeout(t);

        instance.calcHintedTile();

        for (var i = 0; i < instance.tiles.length; i++) {
            var tile = instance.tiles[i];
            computeSubGraph(tile);
        }
        computeGraphData();

        $('#finish_dialog').modal({
            keyboard: false,
            backdrop: 'static',
        });

        /**          
         * Once one person solves the puzzle, the round is over          
         * Send a msg to the server and the server broadcast it to all players          
         **/
        steps = Number(document.getElementById("steps").innerHTML);

        if (roundID >= 0) {
            socket.emit('iSolved', {
                round_id: roundID,
                player_name: player_name,
                steps: steps,
                startTime: startTime,
                totalLinks: hintedLinksNum.totalLinks,
                hintedLinks: hintedLinksNum.hintedLinks,
                correctLinks: hintedLinksNum.correctLinks,
                hintedSteps: hintedLinksNum.hintedSteps,
                totalSteps: hintedLinksNum.totalSteps,
                totalHintsNum: totalHintsNum,
                correctHintsNum: correctHintsNum
            });
        }

    }

    function randomPlaceTiles(xTileCount, yTileCount) {
        var tiles = instance.tiles;
        var tileIndexes = instance.tileIndexes;
        if (instance.saveTilePositions) {
            for (var i = 0; i < instance.saveTilePositions.length; i++) {
                var tilePos = instance.saveTilePositions[i];
                var tile = instance.tiles[tilePos.index];
                placeTile(tile, new Point(tilePos.x, tilePos.y));
                tile.subGraphSize = tilePos.subGraphSize;
                tile.nodesCount = tilePos.nodesCount;
                tile.moved = false; // if one tile just clicked or actually moved(if moved, opacity=1)
                tile.aroundTilesChanged = false;
                tile.noAroundTiles = true;
                tile.aroundTiles = new Array(-1, -1, -1, -1);
                tile.hintedLinks = new Array(-1, -1, -1, -1);
                tile.linksFrom = new Array('', '', '', '');
                tile.linkSteps = new Array(-1, -1, -1, -1);
                tile.conflictTiles = new Array();
                tile.positionMoved = false;
            }
            return;
        }
        // randomly select tiles and place them one by one 
        var offset = new Point(32 - tilesPerColumn + 1, 32 - tilesPerRow / 2);
        for (var y = 0; y < yTileCount; y++) {
            for (var x = 0; x < xTileCount; x++) {

                var index1 = Math.floor(Math.random() * tileIndexes.length);
                var index2 = tileIndexes[index1];
                var tile = tiles[index2];
                tileIndexes.remove(index1, 1);

                var cellPosition = new Point(x * 2 + (y % 2), y) + offset;

                tile.position = cellPosition * instance.tileWidth; // round position(actual (x,y) in the canvas)
                tile.cellPosition = cellPosition; // cell position(in which grid the tile is)
                tile.relativePosition = new Point(0, 0);
                tile.moved = false; // if one tile just clicked or actually moved(if moved, opacity=1)
                tile.aroundTilesChanged = false;
                tile.noAroundTiles = true;
                tile.aroundTiles = new Array(-1, -1, -1, -1);
                tile.hintedLinks = new Array(-1, -1, -1, -1);
                tile.linksFrom = new Array('', '', '', '');
                tile.linkSteps = new Array(-1, -1, -1, -1);
                tile.conflictTiles = new Array();
                tile.positionMoved = false;
            }
        }
    }

    function createTiles(xTileCount, yTileCount) {
        var tiles = new Array();
        var tileRatio = instance.tileWidth / 100.0;
        if (instance.saveShapeArray) {
            instance.shapeArray = instance.saveShapeArray;
        }
        else {
            instance.shapeArray = getRandomShapes(xTileCount, yTileCount);
        }
        var tileIndexes = new Array();
        for (var y = 0; y < yTileCount; y++) {
            for (var x = 0; x < xTileCount; x++) {

                var shape = instance.shapeArray[y * xTileCount + x];

                var maskMap = getMask(tileRatio, shape.topTab, shape.rightTab, shape.bottomTab, shape.leftTab, instance.tileWidth);

                var mask = maskMap.mask;

                var topEdge = maskMap.topEdge;
                topEdge.strokeWidth = instance.colorBorderWidth;
                topEdge.visible = false;

                var rightEdge = maskMap.rightEdge;
                rightEdge.strokeWidth = instance.colorBorderWidth;
                rightEdge.visible = false;

                var bottomEdge = maskMap.bottomEdge;
                bottomEdge.strokeWidth = instance.colorBorderWidth;
                bottomEdge.visible = false;

                var leftEdge = maskMap.leftEdge;
                leftEdge.strokeWidth = instance.colorBorderWidth;
                leftEdge.visible = false;

                var offset = new Point(instance.tileWidth * x, instance.tileWidth * y);
                offset += new Point(instance.tileWidth / 4, instance.tileWidth / 4);
                var img = getTileRaster(
                    instance.puzzleImage,
                    new Size(instance.tileWidth, instance.tileWidth),
                    offset
                );
                var border = mask.clone();
                border.strokeColor = 'grey'; //grey
                border.strokeWidth = (hasBorder == "true") ? 2 : 0;

                var colorBorder = mask.clone();
                colorBorder.strokeWidth = instance.colorBorderWidth;
                colorBorder.visible = false;

                // each tile is a group of
                var tile = new Group(mask, img, border);
                tile.clipped = true;
                tile = new Group(topEdge, rightEdge, bottomEdge, leftEdge, colorBorder, tile);
                tile.topEdge = topEdge;
                tile.rightEdge = rightEdge;
                tile.bottomEdge = bottomEdge;
                tile.leftEdge = leftEdge;
                tile.colorBorder = colorBorder;
                tile.differentColor = new Array();
                tile.colorDirection = new Array();

                tile.picking = false;
                tile.alreadyHinted = false;
                tile.opacity = 1;
                tile.pivot = new Point(instance.tileWidth / 2, instance.tileWidth / 2);

                tile.shape = shape;
                tile.imagePosition = new Point(x, y);

                // tile fixed index/unique id
                tile.findex = y * xTileCount + x;
                tiles.push(tile);
                tile.name = "tile-" + tileIndexes.length;
                tileIndexes.push(tileIndexes.length);
            }
        }
        instance.tileIndexes = tileIndexes;
        return tiles;
    }

    function showUnsureHintColor(tileIndex, hintTilesIndexs, direction, colorIndex) {
        showColorBorder(tileIndex, direction, colorIndex, true, instance.colorBorderWidth);
        for (var i = 0; i < hintTilesIndexs.length; i++) {
            var reverseDirection = 4;
            if (direction % 2 == 0) {
                reverseDirection = 2 - direction;
            }
            else {
                reverseDirection = 4 - direction;
            }
            showColorBorder(hintTilesIndexs[i], reverseDirection, colorIndex, true, instance.colorBorderWidth);

        }
    }

    function showUnsureHintColorWidth(x, y, direction, colorIndex, pushToArray) {
        var width = instance.colorBorderWidth;
        if (instance.edgeMap) {
            var tag = direction % 2 == 0 ? 'T-B': 'L-R';
            var edge = direction == 1 || direction == 2 ? x + tag + y : y + tag + x;
            if (instance.edgeMap[edge]) {
                width = (1 - instance.edgeMap[edge].pro) * width;
            }
            if (width == 0) {
                return;
            }
        }
        showColorBorder(x, direction, colorIndex, pushToArray, width);
        var reverseDirection = 4;
        if (direction % 2 == 0) {
            reverseDirection = 2 - direction;
        }
        else {
            reverseDirection = 4 - direction;
        }
        showColorBorder(y, reverseDirection, colorIndex, pushToArray, width);
    }

    function getRandomShapes(width, height) {
        var shapeArray = new Array();

        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {

                var topTab = undefined;
                var rightTab = undefined;
                var bottomTab = undefined;
                var leftTab = undefined;

                if (y == 0) {
                    topTab = (hasEdge == "true") ? 0 : getRandomTabValue();
                }

                if (y == height - 1) {
                    bottomTab = (hasEdge == "true") ? 0 : getRandomTabValue();
                }

                if (x == 0) {
                    leftTab = (hasEdge == "true") ? 0 : getRandomTabValue();
                }

                if (x == width - 1) {
                    rightTab = (hasEdge == "true") ? 0 : getRandomTabValue();
                }

                shapeArray.push(
                    ({
                        topTab: topTab,
                        rightTab: rightTab,
                        bottomTab: bottomTab,
                        leftTab: leftTab
                    })
                );
            }
        }

        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {

                var shape = shapeArray[y * width + x];

                var shapeRight = (x < width - 1) ?
                    shapeArray[y * width + (x + 1)] :
                    undefined;

                var shapeBottom = (y < height - 1) ?
                    shapeArray[(y + 1) * width + x] :
                    undefined;

                shape.rightTab = (x < width - 1) ?
                    getRandomTabValue() :
                    shape.rightTab;

                if (shapeRight)
                    shapeRight.leftTab = -shape.rightTab;

                shape.bottomTab = (y < height - 1) ?
                    getRandomTabValue() :
                    shape.bottomTab;

                if (shapeBottom)
                    shapeBottom.topTab = -shape.bottomTab;
            }
        }
        return shapeArray;
    }

    function getRandomTabValue() {
        //math.floor() returns max int <= arg
        switch (instance.tileShape) {
            case 'straight': {
                return 0;
                break;
            }
            case 'curved': {
                return Math.pow(-1, Math.floor(Math.random() * 2));;
                break;
            }
            default: {
                return 0;
            }
        }
    }

    function getMask(tileRatio, topTab, rightTab, bottomTab, leftTab, tileWidth) {

        var curvyCoords = [
            0, 0, 35, 15, 37, 5,
            37, 5, 40, 0, 38, -5,
            38, -5, 20, -20, 50, -20,
            50, -20, 80, -20, 62, -5,
            62, -5, 60, 0, 63, 5,
            63, 5, 65, 15, 100, 0
        ];

        var mask = new Path();
        var tileCenter = view.center;

        var topLeftEdge = new Point(0, 0);

        mask.moveTo(topLeftEdge);
        var topEdge = new Path();
        topEdge.moveTo(topLeftEdge);
        //Top
        for (var i = 0; i < curvyCoords.length / 6; i++) {
            var p1 = topLeftEdge + new Point(curvyCoords[i * 6 + 0] * tileRatio, topTab * curvyCoords[i * 6 + 1] * tileRatio);
            var p2 = topLeftEdge + new Point(curvyCoords[i * 6 + 2] * tileRatio, topTab * curvyCoords[i * 6 + 3] * tileRatio);
            var p3 = topLeftEdge + new Point(curvyCoords[i * 6 + 4] * tileRatio, topTab * curvyCoords[i * 6 + 5] * tileRatio);

            mask.cubicCurveTo(p1, p2, p3);
            topEdge.cubicCurveTo(p1, p2, p3);
        }

        //Right
        var topRightEdge = topLeftEdge + new Point(tileWidth, 0);
        var rightEdge = new Path();
        rightEdge.moveTo(topRightEdge);
        for (var i = 0; i < curvyCoords.length / 6; i++) {
            var p1 = topRightEdge + new Point(-rightTab * curvyCoords[i * 6 + 1] * tileRatio, curvyCoords[i * 6 + 0] * tileRatio);
            var p2 = topRightEdge + new Point(-rightTab * curvyCoords[i * 6 + 3] * tileRatio, curvyCoords[i * 6 + 2] * tileRatio);
            var p3 = topRightEdge + new Point(-rightTab * curvyCoords[i * 6 + 5] * tileRatio, curvyCoords[i * 6 + 4] * tileRatio);

            mask.cubicCurveTo(p1, p2, p3);
            rightEdge.cubicCurveTo(p1, p2, p3);
        }

        //Bottom
        var bottomRightEdge = topRightEdge + new Point(0, tileWidth);
        var bottomEdge = new Path();
        bottomEdge.moveTo(bottomRightEdge);
        for (var i = 0; i < curvyCoords.length / 6; i++) {
            var p1 = bottomRightEdge - new Point(curvyCoords[i * 6 + 0] * tileRatio, bottomTab * curvyCoords[i * 6 + 1] * tileRatio);
            var p2 = bottomRightEdge - new Point(curvyCoords[i * 6 + 2] * tileRatio, bottomTab * curvyCoords[i * 6 + 3] * tileRatio);
            var p3 = bottomRightEdge - new Point(curvyCoords[i * 6 + 4] * tileRatio, bottomTab * curvyCoords[i * 6 + 5] * tileRatio);

            mask.cubicCurveTo(p1, p2, p3);
            bottomEdge.cubicCurveTo(p1, p2, p3);
        }

        //Left
        var bottomLeftEdge = bottomRightEdge - new Point(tileWidth, 0);
        var leftEdge = new Path();
        leftEdge.moveTo(bottomLeftEdge);
        for (var i = 0; i < curvyCoords.length / 6; i++) {
            var p1 = bottomLeftEdge - new Point(-leftTab * curvyCoords[i * 6 + 1] * tileRatio, curvyCoords[i * 6 + 0] * tileRatio);
            var p2 = bottomLeftEdge - new Point(-leftTab * curvyCoords[i * 6 + 3] * tileRatio, curvyCoords[i * 6 + 2] * tileRatio);
            var p3 = bottomLeftEdge - new Point(-leftTab * curvyCoords[i * 6 + 5] * tileRatio, curvyCoords[i * 6 + 4] * tileRatio);

            mask.cubicCurveTo(p1, p2, p3);
            leftEdge.cubicCurveTo(p1, p2, p3);
        }
        maskMap = {
            mask: mask,
            topEdge: topEdge,
            rightEdge: rightEdge,
            bottomEdge: bottomEdge,
            leftEdge: leftEdge
        };
        return maskMap;
    }

    var hitOptions = {
        segments: true,
        stroke: true,
        fill: true,
        tolerance: 5
    };

    function createVoronoiTiles(xTileCount, yTileCount) {
        var tiles = new Array();
        var tileIndexes = new Array();
        for (var y = 0; y < yTileCount; y++) {
            for (var x = 0; x < xTileCount; x++) {
                var tileIndex = tileIndexes.length;
                var topLeftPoint = new Point(0, 0);
                var topRightPoint = new Point(0, 0);
                var bottomLeftPoint = new Point(0, 0);
                var bottomRightPoint = new Point(0, 0);

                bottomRightPoint.x = Math.round(instance.tileWidth / 2 + Math.random() * instance.tileWidth);
                bottomRightPoint.y = Math.round(instance.tileWidth / 2 + Math.random() * instance.tileWidth);

                if (x > 0) {
                    var leftTile = tiles[tileIndex - 1];
                    topLeftPoint = leftTile.topRightPoint - new Point(instance.tileWidth, 0);
                    bottomLeftPoint = leftTile.bottomRightPoint - new Point(instance.tileWidth, 0);
                }

                if (y > 0) {
                    var topTile = tiles[tileIndex - instance.tilesPerRow];
                    topLeftPoint = topTile.bottomLeftPoint - new Point(0, instance.tileWidth);
                    topRightPoint = topTile.bottomRightPoint - new Point(0, instance.tileWidth);
                }

                if (x == 0) {
                    if (y == 0) {
                        topRightPoint.x = Math.round(instance.tileWidth / 2 + Math.random() * instance.tileWidth);

                        bottomLeftPoint.y = Math.round(instance.tileWidth / 2 + Math.random() * instance.tileWidth);

                        bottomRightPoint.x = Math.round(instance.tileWidth / 2 + Math.random() * instance.tileWidth);
                        bottomRightPoint.y = Math.round(instance.tileWidth / 2 + Math.random() * instance.tileWidth);
                    }
                    else if (y == yTileCount - 1) {
                        bottomLeftPoint.y = instance.tileWidth;

                        bottomRightPoint.x = Math.round(instance.tileWidth / 2 + Math.random() * instance.tileWidth);
                        bottomRightPoint.y = instance.tileWidth;
                    }
                    else {
                        bottomLeftPoint.y = Math.round(instance.tileWidth / 2 + Math.random() * instance.tileWidth);;

                        bottomRightPoint.x = Math.round(instance.tileWidth / 2 + Math.random() * instance.tileWidth);
                        bottomRightPoint.y = Math.round(instance.tileWidth / 2 + Math.random() * instance.tileWidth);
                    }
                }
                else if (x == xTileCount - 1) {
                    if (y == 0) {
                        topRightPoint.x = instance.tileWidth;

                        bottomRightPoint.x = instance.tileWidth;
                        bottomRightPoint.y = Math.round(instance.tileWidth / 2 + Math.random() * instance.tileWidth);
                    }
                    else if (y == yTileCount - 1) {
                        bottomRightPoint.x = instance.tileWidth;
                        bottomRightPoint.y = instance.tileWidth;
                    }
                    else {
                        bottomRightPoint.x = instance.tileWidth;
                        bottomRightPoint.y = Math.round(instance.tileWidth / 2 + Math.random() * instance.tileWidth);
                    }
                }
                else {
                    if (y == 0) {
                        topRightPoint.x = Math.round(instance.tileWidth / 2 + Math.random() * instance.tileWidth);

                        bottomRightPoint.x = Math.round(instance.tileWidth / 2 + Math.random() * instance.tileWidth);
                        bottomRightPoint.y = Math.round(instance.tileWidth / 2 + Math.random() * instance.tileWidth);
                    }
                    else if (y == yTileCount - 1) {
                        bottomRightPoint.x = Math.round(instance.tileWidth / 2 + Math.random() * instance.tileWidth);
                        bottomRightPoint.y = instance.tileWidth;
                    }
                    else {
                        bottomRightPoint.x = Math.round(instance.tileWidth / 2 + Math.random() * instance.tileWidth);
                        bottomRightPoint.y = Math.round(instance.tileWidth / 2 + Math.random() * instance.tileWidth);
                    }
                }

                var mask = new Path();
                mask.moveTo(topLeftPoint);
                mask.lineTo(topRightPoint);
                mask.lineTo(bottomRightPoint);
                mask.lineTo(bottomLeftPoint);
                mask.closePath();
                mask.opacity = 0.01;
                mask.strokeColor = '#fff'; //white

                var img = getTileRaster(
                    instance.puzzleImage,
                    new Size(instance.tileWidth, instance.tileWidth),
                    new Point(instance.tileWidth * x, instance.tileWidth * y)
                );

                //var border = mask.clone();
                //border.strokeColor = 'red'; //grey
                //border.strokeWidth = 0;

                // each tile is a group of
                var tile = new Group(mask, img);
                tile.topRightPoint = topRightPoint;
                tile.topLeftPoint = topLeftPoint;
                tile.bottomLeftPoint = bottomLeftPoint;
                tile.bottomRightPoint = bottomRightPoint;
                tile.picking = false;
                tile.clipped = true;
                tile.opacity = 1;
                tile.pivot = new Point(instance.tileWidth / 2, instance.tileWidth / 2);

                tile.imagePosition = new Point(x, y);

                // tile fixed index/unique id
                tile.findex = y * xTileCount + x;
                tiles.push(tile);
                tile.name = "tile-" + tileIndexes.length;
                tileIndexes.push(tileIndexes.length);
            }
        }
        instance.tileIndexes = tileIndexes;
        return tiles;
    }


    function getTileRaster(sourceRaster, size, offset) {
        var targetRaster = new Raster('empty');
        var tileWithMarginWidth = size.width + instance.tileMarginWidth * 2;
        var imageData = sourceRaster.getImageData(new Rectangle(
            offset.x - instance.tileMarginWidth,
            offset.y - instance.tileMarginWidth,
            tileWithMarginWidth,
            tileWithMarginWidth));
        targetRaster.setImageData(imageData, new Point(0, 0))
        targetRaster.position = new Point(instance.tileWidth / 2, instance.tileWidth / 2);
        return targetRaster;
    }

    function getTileIndex(tile) {
        if (tile && tile.name) {
            return Number(tile.name.substr(5));
        }
        return -1;
    }

    this.removeSelectedTile = function(point) {
        if (!instance.draging) {
            return;
        }
        var hitResult = project.hitTest(point);
        if (!hitResult || hitResult.type != "pixel") {
            return;
        }
        var img = hitResult.item;
        var tile = img.parent.parent;
        if (tile && tile.picking && tile.name) {
            var index = -1;
            for (var i = 0; i < instance.selectedTile.length; i++) {
                if (tile == instance.selectedTile[i]) {
                    index = i;
                }
            }

            tile.picking = false;
            tile.position = tile.cellPosition * instance.tileWidth;
            tile.opacity = 1;
            tile.relativePosition = new Point(0, 0);

            if (index >= 0) {
                instance.selectedTile.splice(index, 1);
                if(instance.selectedTile.length == 0) {
                    instance.draging = false;
                    instance.selectedTile = null;
                }
                if (index == 0 && instance.selectedTile) {
                    for (var i = 0; i < instance.selectedTile.length; i++) {
                        if (i == 0) {
                            instance.selectedTile[i].relativePosition = new Point(0, 0);
                        }
                        else {
                            instance.selectedTile[i].relativePosition = instance.selectedTile[i].cellPosition - instance.selectedTile[0].cellPosition;
                        }
                    }
                }
            }
        }
    }

    this.pickTileFromTo = function (from, to) {
        var lx = from.x < to.x ? from.x : to.x;
        var rx = from.x > to.x ? from.x : to.x;
        var ly = from.y < to.y ? from.y : to.y;
        var ry = from.y > to.y ? from.y : to.y;

        if (instance.selectedTile == null) {
            instance.ctrlDrag = false;
            instance.selectedTile = new Array();
        }

        for (var i = 0; i < instance.tiles.length; i++) {
            var tile = instance.tiles[i];
            if (tile.picking) {
                continue;
            }
            var x = tile.position.x;
            var y = tile.position.y;
            if (lx <= x && x <= rx && ly <= y && y <= ry) {
                if (instance.selectedTile.length == 0) {
                    tile.relativePosition = new Point(0, 0);
                }
                else{
                    tile.relativePosition = tile.cellPosition - instance.selectedTile[0].cellPosition;
                }
                instance.selectedTile.push(tile);
            }
        }

        if (instance.selectedTile.length > 0) {
            instance.draging = true;
            var pos = new Point(instance.selectedTile[0].position.x, instance.selectedTile[0].position.y);
            for (var i = 0; i < instance.selectedTile.length; i++) {
                var tile = instance.selectedTile[i];
                tile.picking = true;
                tile.opacity = 0.5;
                tile.position = pos + tile.relativePosition * instance.tileWidth;
                tile.originPosition = tile.cellPosition;
                tile.onDoubleClick = function(event) {
                    instance.removeSelectedTile(event.point);
                };
            }
        }
    }

    this.pickTile = function (point, ctrl) {
        if (instance.hintsShowing) {
            return;
        }
        if (instance.selectedTile == null) {
            instance.ctrlDrag = false;
            instance.selectedTile = new Array();
        }
        if (!instance.ctrlDrag) {
            findSelectTile(point, instance.selectedTile);
        }
        if (instance.selectedTile && instance.selectedTile.length > 0) {
            $('html,body').css('cursor', 'move');
            if (ctrl && !instance.ctrlDrag || !instance.selectedTile[0].picking) {
                for (var i = 0; i < instance.selectedTile.length; i++) {
                    instance.selectedTile[i].picking = true;
                }
            }
            else {
                instance.releaseTile();
                return 0;
            }

            instance.draging = true;

            var pos = new Point(instance.selectedTile[0].position.x, instance.selectedTile[0].position.y);
            for (var i = 0; i < instance.selectedTile.length; i++) {
                var tile = instance.selectedTile[i];
                tile.opacity = 0.5;
                if (i > 0) {
                    tile.relativePosition = tile.cellPosition - instance.selectedTile[0].cellPosition;
                }
                else {
                    tile.relativePosition = new Point(0, 0);
                }
                tile.position = pos + tile.relativePosition * instance.tileWidth;
                tile.originPosition = tile.cellPosition;
                tile.onDoubleClick = function(event) {
                    instance.removeSelectedTile(event.point);
                };
            }
            return instance.selectedTile.length;
        }
        else if(!ctrl) {
            instance.selectedTile = null;
        }
        return 0;
    }
    /*
    *restplace的冲突检查
    */
    function checkResetPlaceConflict(tiles, centerCellPosition) {
        if (checkCellPositionOutOfRange(centerCellPosition)) {
            return true;
        }
        var hasConflict = false;

        var onlyOneTile = (tiles.length == 1);
        for (var i = 0; i < tiles.length; i++) {
            var tile = tiles[i];
            var cellPosition = centerCellPosition + tile.relativePosition;
            if (checkCellPositionOutOfRange(cellPosition)) {
                return true;
            }

            var alreadyPlacedTile = (getTileAtCellPosition(cellPosition) != undefined);
            hasConflict = alreadyPlacedTile;
            if (!hasConflict) {
                for(var j=0;j<8;j++){
                    var checkTile = getTileAtCellPosition(cellPosition+resetplaceDirctions[j]);
                    var checkTileConflict = (checkTile != undefined);
                    if(checkTileConflict == true){
                        return true;
                    }
                }
            }else{
                return true;
            }
        }
        return hasConflict;
    }

    function checkCellPositionOutOfRange(cellPosition) {
        return !(0 < cellPosition.x && cellPosition.x < 63 &&
                0 < cellPosition.y && cellPosition.y < 63);
    }

    function checkConflict(tiles, centerCellPosition, selectedGroupTiles) {
        if (checkCellPositionOutOfRange(centerCellPosition)) {
            return [true];
        }
        var hasConflict = false;
        var needToMove = true;

        if (this.allowOverlap)
            return [hasConflict];
        var onlyOneTile = (tiles.length == 1);
        for (var i = 0; i < tiles.length; i++) {
            if(hasConflict && !needToMove)
                break;
            var tile = tiles[i];
            var tileIndex = getTileIndex(tile);

            var cellPosition = centerCellPosition + tile.relativePosition;
            if (checkCellPositionOutOfRange(cellPosition)) {
                return [true];
            }
            var roundPosition = cellPosition * instance.tileWidth;

            var alreadyPlacedTile = (getTileAtCellPosition(cellPosition) != undefined);

            if(alreadyPlacedTile && (typeof selectedGroupTiles !== 'undefined')){
                var theTile = getTileAtCellPosition(cellPosition);
                for (var j = 0; j < selectedGroupTiles.length; j++) {
                    if (selectedGroupTiles[j] == theTile) {
                        needToMove = false;
                        break;
                    }
                }
            }
            hasConflict = hasConflict || alreadyPlacedTile;
            if (!hasConflict && instance.tileShape != "voronoi") {
                var topTile = getTileAtCellPosition(cellPosition + new Point(0, -1));
                var rightTile = getTileAtCellPosition(cellPosition + new Point(1, 0));
                var bottomTile = getTileAtCellPosition(cellPosition + new Point(0, 1));
                var leftTile = getTileAtCellPosition(cellPosition + new Point(-1, 0));

                var hintAroundTiles = undefined;
                if (instance.hintsShowing) {
                    hintAroundTiles = instance.hintAroundTilesMap[tileIndex];
                }

                var topTileConflict = (topTile != undefined) && (!(topTile.shape.bottomTab + tile.shape.topTab == 0) ||
                    (instance.tileShape == 'curved' && topTile.shape.bottomTab == 0 && tile.shape.topTab == 0));
                if (hintAroundTiles) {
                    topTileConflict = topTileConflict || (topTile != undefined
                        && getTileIndex(topTile) != hintAroundTiles[0]);
                }
                if(topTileConflict && (typeof selectedGroupTiles !== 'undefined')){
                    for (var j = 0; j < selectedGroupTiles.length; j++) {
                        if (selectedGroupTiles[j] == topTile) {
                            needToMove = false;
                            break;
                        }
                    }
                }

                var rightTileConflict = (rightTile != undefined) && (!(rightTile.shape.leftTab + tile.shape.rightTab == 0) ||
                    (instance.tileShape == 'curved' && rightTile.shape.leftTab == 0 && tile.shape.rightTab == 0));
                if (hintAroundTiles) {
                    rightTileConflict = rightTileConflict || (rightTile != undefined 
                        && getTileIndex(rightTile) != hintAroundTiles[1]);
                }
                if(rightTileConflict && (typeof selectedGroupTiles !== 'undefined')){
                    for (var j = 0; j < selectedGroupTiles.length; j++) {
                        if (selectedGroupTiles[j] == rightTile) {
                            needToMove = false;
                            break;
                        }
                    }
                }

                var bottomTileConflict = (bottomTile != undefined) && (!(bottomTile.shape.topTab + tile.shape.bottomTab == 0) ||
                    (instance.tileShape == 'curved' && bottomTile.shape.topTab == 0 && tile.shape.bottomTab == 0));
                if (hintAroundTiles) {
                    bottomTileConflict = bottomTileConflict || (bottomTile != undefined
                        && getTileIndex(bottomTile) != hintAroundTiles[2]);
                }
                if(bottomTileConflict && (typeof selectedGroupTiles !== 'undefined')){
                    for (var j = 0; j < selectedGroupTiles.length; j++) {
                        if (selectedGroupTiles[j] == bottomTile) {
                            needToMove = false;
                            break;
                        }
                    }
                }

                var leftTileConflict = (leftTile != undefined) && (!(leftTile.shape.rightTab + tile.shape.leftTab == 0) ||
                    (instance.tileShape == 'curved' && leftTile.shape.rightTab == 0 && tile.shape.leftTab == 0));
                if (hintAroundTiles) {
                    leftTileConflict = leftTileConflict || (leftTile != undefined
                        && getTileIndex(leftTile) != hintAroundTiles[3]);
                }
                if(leftTileConflict && (typeof selectedGroupTiles !== 'undefined')){
                    for (var j = 0; j < selectedGroupTiles.length; j++) {
                        if (selectedGroupTiles[j] == leftTile) {
                            needToMove = false;
                            break;
                        }
                    }
                }

                var aroundConflict = topTileConflict || bottomTileConflict || rightTileConflict || leftTileConflict;
                var hasConflict = aroundConflict || hasConflict;

            }
        }
        return [hasConflict,needToMove];
    }

    function placeTile(tile, cellPosition) {
        var roundPosition = cellPosition * instance.tileWidth;
        if (instance.hintsShowing) {
            tile.preStep = instance.steps - 1;
        }
        else {
            tile.preStep = instance.steps;
        }
        tile.preCellPosition = tile.cellPosition;
        tile.position = roundPosition;
        if (tile.originPosition) {
            if (cellPosition == tile.originPosition) {
                tile.positionMoved = false;
            }
            else {
                tile.positionMoved = true;
            }
        }
        else {
            tile.positionMoved = false;
        }
        tile.cellPosition = cellPosition;
        tile.relativePosition = new Point(0, 0);
    }
    function prePlaceTile(tile, cellPosition) {
        var roundPosition = cellPosition * instance.tileWidth;
        if (instance.hintsShowing) {
            tile.preStep = instance.steps - 1;
        }
        else {
            tile.preStep = instance.steps;
        }
        tile.preCellPosition = tile.cellPosition;
        tile.position = roundPosition;
        if (tile.originPosition) {
            if (cellPosition == tile.originPosition) {
                tile.positionMoved = false;
            }
            else {
                tile.positionMoved = true;
            }
        }
        else {
            tile.positionMoved = false;
        }
        tile.cellPosition = cellPosition;
        //tile.relativePosition = new Point(0, 0);
    }
    this.undoNextStep = function () {
        instance.undoing = true;

        var tilesMoved = false;

        for (var i = 0; i < instance.tiles.length; i++) {
            var tile = instance.tiles[i];
            tile.beenUndo = false;
            if (tile.preStep == instance.steps - 1) {
                tile.beenUndo = true;
                placeTile(tile, tile.preCellPosition);
                tilesMoved = true;
            }
        }

        for (var i = 0; i < instance.tiles.length; i++) {
            var tile = instance.tiles[i];
            if (tile.beenUndo) {
                refreshAroundTiles(tile, false);
            }
        }

        for (var i = 0; i < instance.tiles.length; i++) {
            var tile = instance.tiles[i];
            if (tile.beenUndo) {
                if (tile.aroundTilesChanged) {
                    computeSubGraph(tile);
                }
                tile.beenUndo = false;
            }
        }

        computeGraphData();

        if (tilesMoved) {
            instance.steps += 1;
            instance.realStepsCounted = false;

            document.getElementById("steps").innerHTML = instance.realSteps;
            undoStep = instance.steps;
            $('#undo_button').css('display', 'none');
            saveGame();
            normalizeTiles();
        }

        instance.undoing = false;
    }

    function generateLinksTags(x, y, direction, beHinted, from) {
        if (from == '') {
            from = player_name;
        }
        switch (direction) {
            case 0: return { x: Number(y), y: Number(x), tag: "T-B", beHinted: beHinted, from: from };
            case 1: return { x: Number(x), y: Number(y), tag: "L-R", beHinted: beHinted, from: from };
            case 2: return { x: Number(x), y: Number(y), tag: "T-B", beHinted: beHinted, from: from };
            case 3: return { x: Number(y), y: Number(x), tag: "L-R", beHinted: beHinted, from: from };
        }
    }

    function dfsGraph(tileIndex) {
        if (instance.dfsGraphLinksMap[tileIndex]) {
            return;
        }
        instance.dfsGraphLinksMap[tileIndex] = new Array();
        instance.subGraphNodesCount += 1;
        var tile = instance.tiles[tileIndex];
        for (var i = 0; i < tile.aroundTiles.length; i++) {
            var aroundTileIndex = tile.aroundTiles[i];
            if (aroundTileIndex < 0 || (instance.dfsGraphLinksMap[aroundTileIndex] &&
                instance.dfsGraphLinksMap[aroundTileIndex][tileIndex])) {
                continue;
            }
            instance.dfsGraphLinksMap[tileIndex][aroundTileIndex] = true;
            var beHinted = (aroundTileIndex == Math.floor(tile.hintedLinks[i]));
            var from = tile.linksFrom[i];

            if (!beHinted || instance.gameFinished || !hintDelay || aroundTileIndex != tile.hintedLinks[i]) {
                instance.subGraphData.push(generateLinksTags(tileIndex, aroundTileIndex, i, beHinted, from));
            }
            dfsGraph(aroundTileIndex);
        }
    }

    function updateGraphSize(preSize) {
        var size = instance.subGraphData.length - preSize;
        var nodes = instance.subGraphNodesCount;
        for (var i = preSize; i < instance.subGraphData.length; i++) {
            instance.subGraphData[i].size = size;
            instance.subGraphData[i].nodes = nodes;
        }
    }
    this.askHelp = function() {
        if (ctrlDown || mousedowned || instance.gameFinished) {
            return;
        }
        if (instance.lastAskHelpStep == instance.realSteps){
            $.amaran({
                'title': 'Warning',
                'message': 'Too frequent!',
                'inEffect': 'slideRight',
                'cssanimationOut': 'zoomOutUp',
                'position': "top right",
                'delay': 2000,
                'closeOnClick': true,
                'closeButton': true
            });
            return;
        }


        socket.emit('survey', {
            round_id:roundID,
            player_name: player_name,
            survey_type: 'askHelp',
        });

        if (mousedowned || instance.hintsShowing) {
            return;
        }

        var event_name = algorithm == 'distribute' ? 
            'distributed_fetchHints' : 'fetchHints';
        socket.emit(event_name, {
            "round_id": roundID,
            "player_name": player_name,
            "tilesNum": instance.tilesNum
        });
    }

    function processProactiveHints(data) {
        if (!ctrlDown && !mousedowned && !instance.hintsShowing && data && data.sureHints) {
            if (!instance.hintsShowing) {
                instance.hintsShowing = true;
            }
            else {
                return;
            }
            instance.hintsShowingType = 'proactive';

            instance.hintsLog = {
                type: 'proactive',
                hints: JSON.stringify(data.sureHints),
                log: new Array(),
            };
            instance.hintAroundTilesMap = data.sureHints;

            checkCorrectHints(instance.tiles, instance.hintAroundTilesMap);

            var strongHintsNeededTiles = new Array();
            
            for (var index = 0; index < instance.tiles.length; index++) {
                var tile = instance.tiles[index];
                for (var j = 0; j < 4; j++) {
                    if (data.sureHints[index][j] > -1) {
                        strongHintsNeededTiles.push(index);
                        break;
                    }
                }
            }

            var shouldSave = showStrongAndWeakHints(data.sureHints, strongHintsNeededTiles, null);
            if (shouldSave) {
                instance.realStepsCounted = false;
                instance.lastAskHelpStep = instance.realSteps;
                saveGame();
            }

            computeHintedSubGraph();
            normalizeTiles();

            if (!instance.gameFinished) {
                var errors = checkTiles();
                if (errors == 0) {
                    finishGame();
                }
            }
            
            if (!shouldSave){
                processUnsureHints(data.unsureHints);
            }
            
            instance.hintsShowingType = undefined;
            instance.hintsShowing = false;
        }
    }

    socket.on('proactiveHints', function(data) {
        instance.singleArray = new Array();
        processProactiveHints(data);
        if (instance.singleArray.length > 0) {
            instance.hintsShowing = true;
            for (var i = 0; i < instance.singleArray.length; i++) {
                var single = instance.singleArray[i];
                if (!single) {
                    continue;
                }
                var single = instance.singleArray[i];
                var tile = single.tile;
                tile.position = single.originPosition;
            }
        }
        if (data.edgeMap) {
            instance.edgeMap = data.edgeMap;
            showVulnerableEdges();
        }
    });

    this.releaseTile = function () {
        if (instance.draging) {
            if (!instance.selectedTile || instance.selectedTile.length == 0) {
                instance.draging = false;
                instance.selectedTile = null;
            }
            var centerCellPosition = new Point(
                Math.round(instance.selectedTile[0].position.x / instance.tileWidth),
                Math.round(instance.selectedTile[0].position.y / instance.tileWidth));

            var originCenterCellPostion = instance.selectedTile[0].originPosition;

            var hasConflicts = checkConflict(instance.selectedTile, centerCellPosition);
            var hasConflict = hasConflicts[0];
            for (var i = 0; i < instance.selectedTile.length; i++) {
                instance.selectedTile[i].picking = false;
            }

            var tilesMoved = false;
            for (var i = 0; i < instance.selectedTile.length; i++) {
                var tile = instance.selectedTile[i];
                var cellPosition = undefined;
                if (hasConflict) {
                    cellPosition = originCenterCellPostion + tile.relativePosition;
                }
                else {
                    cellPosition = centerCellPosition + tile.relativePosition;
                }
                placeTile(tile, cellPosition);
                tilesMoved = tilesMoved || tile.positionMoved;
            }

            instance.createSomeLinks = false;
            for (var i = 0; i < instance.selectedTile.length; i++) {
                refreshAroundTiles(instance.selectedTile[i], false);
            }

            for (var i = 0; i < instance.selectedTile.length; i++) {
                var tile = instance.selectedTile[i];
                if (tile.aroundTilesChanged) {
                    computeSubGraph(tile);
                }
            }

            computeGraphData();

            if (tilesMoved && !instance.gameFinished) {
                instance.steps += 1;
                instance.realStepsCounted = false;

                if (instance.realSteps > 0 && instance.realSteps % 5 == 0) {
                    sendRecord(false, 5);
                }

                document.getElementById("steps").innerHTML = instance.realSteps;
                $('#undo_button').css('display', 'inline');
                saveGame();
            }

            if (!hasConflict && instance.showHints && instance.createSomeLinks) {
                var selectedTileIndexes = new Array();
                for (var i = 0; i < instance.selectedTile.length; i++) {
                    selectedTileIndexes.push(getTileIndex(instance.selectedTile[i]));
                }
                getHints(roundID, selectedTileIndexes);
            }

            for (var i = 0; i < instance.selectedTile.length; i++) {
                instance.selectedTile[i].opacity = 1;
            }

            instance.selectedTile = null;
            instance.draging = false;

            if (!instance.gameFinished) {
                var errors = checkTiles();
                if (errors == 0) {
                    finishGame();
                    //clearTimeout(instance.askHelpTimeout);
                }
            }
            $('html,body').css('cursor', 'default');
            normalizeTiles();

            instance.ctrlDrag = false;
        }
    }

    this.generateEdges = function() {
        var edges = new Array();
        for (var i = 0; i < instance.tiles.length; i++) {
            var tile = instance.tiles[i];
            for (var j = 1; j < 3; j++) {
                if (tile.aroundTiles[j] >= 0) {
                    var tag = j == 1 ? "L-R" : "T-B";
                    var x = i;
                    var y = tile.aroundTiles[j];
                    var edgeName = x + tag + y;
                    var beHinted = Math.floor(tile.hintedLinks[j]) == y;
                    var linksFrom = tile.linksFrom[j];
                    edges.push({
                        edge: edgeName,
                        hinted: beHinted,
                        from: linksFrom
                    });
                }
            }
        }
        return edges;
    }

    /**
     *  Update links in the background graph
     *  Check which case it is in the 4 cases, and call the corrosponding method:
     *  *  When one link is created:
     *  1, If the link does not exist, create a link;
     *  2, If the link already exists, update: append the user to the supporter list of the selected tile;
     *  *  When one link is destroyed:
     *  1, If the user is the only one supporter, remove;
     *  2, Else update: remove the user from the supporter list of the 2 tiles
     */

    /**
    * Check links change of the selected tile(s), and update the database
    * @param selectedTileIndex  Number the selected tile index
    * @param aroundTilesBefore  Tiles indexes around the selected before one step
    * @param aroundTilesAfter  Tiles indexes around the selected after one step
    * e.g. ({
        "round_id":0,
        "selectedTile": 1,
        "aroundTiles":[{
            "before": -1,
            "after": 3
        },{
            "before": -1,
            "after": -1
        },{
                "before": 2,
            "after": 3
        },{
                "before": -1,
            "after": -1
        }]
    })
    */
    function computeSubGraph(tile) {
        instance.subGraphNodesCount = 0;

        var selectedTileIndex = getTileIndex(tile);
        var aroundTilesBefore = tile.oldAroundTiles;
        var aroundTilesAfter = tile.aroundTiles;

        var preSize = instance.subGraphData.length;
        dfsGraph(selectedTileIndex);
        if (preSize < instance.subGraphData.length) {
            updateGraphSize(preSize);
        }
        instance.subGraphNodesCount = 0;

        for (var i = 0; i < 4; i++) {
            if (aroundTilesBefore[i] >= 0) {
                preSize = instance.subGraphData.length;
                dfsGraph(aroundTilesBefore[i]);
                if (preSize < instance.subGraphData.length) {
                    updateGraphSize(preSize);
                }
                instance.subGraphNodesCount = 0;

                if (aroundTilesBefore[i] != aroundTilesAfter[i]) {
                    var beHinted = (aroundTilesBefore[i] == Math.floor(tile.hintedLinks[i]));
                    var from = tile.linksFrom[i];
                    removeLink = generateLinksTags(selectedTileIndex, aroundTilesBefore[i], i, beHinted, from);
                    removeLink.size = -tile.subGraphSize;
                    removeLink.nodes = tile.nodesCount;
                    instance.removeLinksData.push(removeLink);
                }
            }
            if (aroundTilesAfter[i] >= 0) { // useless
                preSize = instance.subGraphData.length;
                dfsGraph(aroundTilesAfter[i]);
                if (preSize < instance.subGraphData.length) {
                    updateGraphSize(preSize);
                }
                instance.subGraphNodesCount = 0;
            }
        }

        return true;
    }

    function computeGraphData() {
        instance.subGraphData = instance.removeLinksData.concat(instance.subGraphData);
        instance.getHintsArray = new Array();
        var hintsConflict = new Array();
        var edges = {};
        for (var i = 0; i < instance.subGraphData.length; i++) {
            var linksData = instance.subGraphData[i];
            var xTile = instance.tiles[linksData.x];
            var yTile = instance.tiles[linksData.y];
            var key = linksData.x + linksData.tag + linksData.y;
            edges[key] = linksData;
            if (linksData.size < 0) {
                xTile.subGraphSize = 0;
                yTile.subGraphSize = 0;
                xTile.nodesCount = 1;
                yTile.nodesCount = 1;
            }
            else {
                xTile.subGraphSize = linksData.size;
                yTile.subGraphSize = linksData.size;
                xTile.nodesCount = linksData.nodes;
                yTile.nodesCount = linksData.nodes;
                if (!xTile.allAroundByTiles) {
                    instance.getHintsArray[linksData.x] = true;
                }
                if (!yTile.allAroundByTiles) {
                    instance.getHintsArray[linksData.y] = true;
                }
                if (instance.conflictEdgesTimesMap[key]) {
                    hintsConflict.push({
                        edge: key,
                        time: -instance.conflictEdgesTimesMap[key]
                    });
                    delete instance.conflictEdgesTimesMap[key];
                }
            }
        }

        instance.maxSubGraphSize = 0;
        for (var i = 0; i < instance.tiles.length; i++) {
            var tile = instance.tiles[i];
            if (tile.subGraphSize > instance.maxSubGraphSize) {
                instance.maxSubGraphSize = tile.subGraphSize;
            }
        }
        if (instance.subGraphData.length > 0 || hintsConflict.length > 0 
            || instance.hintsConflict.size > 0 || instance.hintsLog.sure_hints) {
            if(!instance.hintsShowing){
                instance.hintsLog = {};
            }
            var param = {
                player_name: player_name,
                algorithm: algorithm,
                round_id: roundID,
                time: parseInt(Date.now() / 1000),
                edges: edges,
                tilesPerRow: tilesPerRow,
                tilesPerColumn: tilesPerColumn,
                is_hint: instance.hintsShowing && !instance.gameFinished
                //logs: instance.hintsLog
            };
            if (param.is_hint) {
                var conflict = Array.from(instance.hintsConflict);
                for (var i = 0; i < conflict.length; i++) {
                    var edge = conflict[i];
                    hintsConflict.push({
                        edge: edge,
                        time: 1
                    });
                    var conflictTimes = instance.conflictEdgesTimesMap[edge];
                    conflictTimes = conflictTimes ? conflictTimes + 1 : 1;
                    instance.conflictEdgesTimesMap[edge] = conflictTimes;
                }
            }
            if (hintsConflict.length > 0) {
                param.conflict = hintsConflict;
            }
            socket.emit("uploadForGA", param);
            instance.subGraphDataQueue.push(param);
            setTimeout(uploadGraphData, uploadDelayTime * 1000);
        }
        uploadGraphData();

        instance.dfsGraphLinksMap = new Array();
        instance.subGraphData = new Array();
        instance.removeLinksData = new Array();
    }

    function uploadGraphData(){
        if(instance.subGraphDataQueue.length == 0){
            return;
        }

        var nowTime = Date.now();
        for (var i = 0; i < instance.subGraphDataQueue.length - 1; i++) {
            var olderGraphData = instance.subGraphDataQueue[i];
            for (var j = i + 1; j < instance.subGraphDataQueue.length; j++) {
                var newerGraphData = instance.subGraphDataQueue[j];
                if (newerGraphData.is_hint !== olderGraphData.is_hint) {
                    continue;
                }
                for (var key in olderGraphData.edges){
                    if (key in newerGraphData.edges){
                        olderGraphData.edges[key] = newerGraphData.edges[key];
                        delete newerGraphData.edges[key];
                    }
                }
                if (olderGraphData.time === newerGraphData.time) {
                    for (var key in newerGraphData.edges){
                        olderGraphData.edges[key] = newerGraphData.edges[key];
                        delete newerGraphData.edges[key];
                    }
                }
            }
        }
        
        while (instance.subGraphDataQueue.length > 0) {
            var param = instance.subGraphDataQueue[0];
            if(instance.gameFinished || parseInt(nowTime / 1000 - param.time) >= uploadDelayTime){
                edges_count = Object.getOwnPropertyNames(param.edges).length;
                if(edges_count > 0){
                    var event_name = algorithm == 'distribute' ?
                        'distributed_upload' : 'upload';
                    socket.emit(event_name, param);
                }
                instance.subGraphDataQueue.shift();
            }
            else{
                break;
            }
        }
    }

    function hideAllColorBorder() {
        for (var i = 0; i < instance.tiles.length; i++) {
            var tile = instance.tiles[i];
            if (tile.differentColor.length > 0) {
                tile.topEdge.visible = false;
                tile.rightEdge.visible = false;
                tile.bottomEdge.visible = false;
                tile.leftEdge.visible = false;
                tile.colorBorder.visible = false;
                tile.differentColor = new Array();
                tile.colorDirection = new Array();
            }
            tile.opacity = 1;
        }
    }

    function hideColorBorder(index) {
        if (index < 0) {
            return;
        }
        var tile = instance.tiles[index];
        if (tile.differentColor.length > 0) {
            if (tile.topEdge.visible) {
                tile.topEdge.visible = false;
                hideColorBorder(tile.aroundTiles[0]);
            }
            if (tile.rightEdge.visible) {
                tile.rightEdge.visible = false;
                hideColorBorder(tile.aroundTiles[1]);
            }
            if (tile.bottomEdge.visible) {
                tile.bottomEdge.visible = false;
                hideColorBorder(tile.aroundTiles[2]);
            }
            if (tile.leftEdge.visible) {
                tile.leftEdge.visible = false;
                hideColorBorder(tile.aroundTiles[3]);
            }
            tile.colorBorder.visible = false;
        }
        for (var i = 0; i < instance.tiles.length; i++) {
            var tile = instance.tiles[i];
            if (tile.differentColor.length == 0) {
                tile.opacity = 1;
            }
        }
    }

    function setGradientStrockColor(path, color) {
        path.strokeColor = {
            gradient: {
                stops: [[color, 0.7], ['white', 1]],
                radial: true
            },
            origin: path.position,
            destination: path.bounds
        };
    }

    function showColorBorder(index, direction, colorIndex, pushToArray, width) {
        var tile = instance.tiles[index];
        switch (direction) {
            case 0:
                tile.topEdge.strokeWidth = width;
                tile.topEdge.visible = true;
                setGradientStrockColor(tile.topEdge, instance.unsureHintsColor[colorIndex]);
                break;
            case 1:
                tile.rightEdge.strokeWidth = width;
                tile.rightEdge.visible = true;
                setGradientStrockColor(tile.rightEdge, instance.unsureHintsColor[colorIndex]);
                break;
            case 2:
                tile.bottomEdge.strokeWidth = width;
                tile.bottomEdge.visible = true;
                setGradientStrockColor(tile.bottomEdge, instance.unsureHintsColor[colorIndex]);
                break;
            case 3:
                tile.leftEdge.strokeWidth = width;
                tile.leftEdge.visible = true;
                setGradientStrockColor(tile.leftEdge, instance.unsureHintsColor[colorIndex]);
                break;
            default:
                tile.colorBorder.strokeWidth = width;
                tile.colorBorder.visible = true;
                setGradientStrockColor(tile.colorBorder, instance.unsureHintsColor[colorIndex]);
                break;
        }
        if (pushToArray) {
            var repeated = false;
            for (var i = 0; i < tile.differentColor.length; i++) {
                if (tile.differentColor[i] == direction) {
                    repeated = true;
                }
            }
            if (!repeated) {
                tile.differentColor.push(direction);
                tile.colorDirection.push(colorIndex);
            }
        }
    }

    function normalizeTiles(forAskHelp) {
        var leftUpPoint = new Point(10000, 10000);
        var rightBottomPoint = new Point(-10000, -10000);
        for (var i = 0; i < instance.tiles.length; i++) {
            var tile = instance.tiles[i];
            var position = tile.position;
            if (position.x < leftUpPoint.x) {
                leftUpPoint.x = position.x;
            }
            if (position.y < leftUpPoint.y) {
                leftUpPoint.y = position.y;
            }
            if (position.x > rightBottomPoint.x) {
                rightBottomPoint.x = position.x;
            }
            if (position.y > rightBottomPoint.y) {
                rightBottomPoint.y = position.y;
            }

            var cellPosition = new Point(
                Math.round(position.x / instance.tileWidth),//returns int closest to arg
                Math.round(position.y / instance.tileWidth));

            tile.position = cellPosition * instance.tileWidth; // round position(actual (x,y) in the canvas)
            tile.cellPosition = cellPosition; // cell position(in which grid the tile is)

            tile.relativePosition = new Point(0, 0);
            tile.picking = false;
            tile.moved = false; // if one tile just clicked or actually moved(if moved, opacity=1)
            if (!forAskHelp) {
                tile.aroundTilesChanged = false;
            }
            tile.positionMoved = false;
        }
        instance.centerPoint = (leftUpPoint + rightBottomPoint) / 2;
    }

    function checkHints(selectedTileIndex, dir, hintIndex) {
        if (hintIndex < 0) {
            return;
        }
        totalHintsNum += 1;
        var correctIndex = selectedTileIndex + directions[dir].x + directions[dir].y * instance.tilesPerRow;
        if (hintIndex == correctIndex) {
            correctHintsNum += 1;
        }
    }

    function computeHintedSubGraph() {
        for (var i in instance.hintedTilesMap) {
            var tile = instance.tiles[i];
            refreshAroundTiles(tile, true);
        }

        for (var i in instance.hintedTilesMap) {
            var tile = instance.tiles[i];
            if (tile.aroundTilesChanged) {
                computeSubGraph(tile);
            }
        }

        computeGraphData();
        instance.hintedTilesMap = new Array();
        instance.hintsLog = {};
    }

    function getHints(round_id, selectedTileIndexes) {
        if (roundID < 0) {
            return;
        }
        // var hintTileIndexes=new Array(-1,-1,-1,-1);
        var currentStep = instance.steps;
        var getHintsIndex = new Array();
        for (var i = 0; i < instance.getHintsArray.length; i++) {
            if (instance.getHintsArray[i]) {
                getHintsIndex.push(i);
            }
        }
        if (getHintsIndex.length > 0) {
            var event_name = algorithm == 'distribute' ? 
                'distributed_getHintsAround' : 'getHintsAround';
            socket.emit(event_name, {
                "round_id": round_id,
                "player_name": player_name,
                "selectedTileIndexes": selectedTileIndexes,
                "indexes": getHintsIndex,
                "currentStep": currentStep,
                "tilesNum": instance.tilesNum
            });
        }
    }

    function processUnsureHints(unsureHints, indexes) {
        if (!unsureHints) {
            return;
        }
        hideAllColorBorder();
        var indexesMap = {};
        if (indexes) {
            for (var i = 0; i < indexes.length; i++) {
                indexesMap[indexes[i]] = true;
            }
        }
        var colorIndex = 1;
        for (var i = 0; i < unsureHints.length; i++) {
            if (unsureHints[i] && colorIndex < instance.unsureHintsColor.length) {
                var unsureHint = unsureHints[i];
                var index = unsureHint.index;
                if (!indexes || indexesMap[index]) {
                    for (var d = 0; d < 4; d++) {
                        if (unsureHint.aroundTiles[d].length > 0 &&
                            instance.tiles[index].aroundTiles[d] < 0) {
                            showUnsureHintColor(index, unsureHint.aroundTiles[d], d, colorIndex);
                            colorIndex += 1;
                            if (colorIndex >= instance.unsureHintsColor.length) {
                                break;
                            }
                        }
                    }
                }
            }
            else {
                break;
            }
        }
        /*
        if (colorIndex > 0) {
            for (var i = 0; i < instance.tiles.length; i++) {
                var tile = instance.tiles[i];
                if (!tile.differentColor || tile.differentColor.length == 0) {
                    tile.opacity = 0.25;
                }
            }
        }*/
    }

    function countBidirectionLinks(sureHints){
        var bidirectionLinks = new Array();
        for (var i = 0; i < sureHints.length; i++) {
            bidirectionLinks[i] = {
                count: 0,
                aroundTiles: [false, false, false, false]
            }
            for (var j = 0; j < 4; j++) {
                var oppositiveTileIndex = sureHints[i][j];
                if(oppositiveTileIndex != -1){
                    var oppositiveEdge = oppositiveEdges[j];
                    if(i == sureHints[oppositiveTileIndex][oppositiveEdge]){
                        bidirectionLinks[i].count += 1;
                        bidirectionLinks[i].aroundTiles[j] = true;
                    }
                }
            }
        }
        return bidirectionLinks;
    }

    function sortTile(t1, t2) {
        var tile1 = instance.tiles[t1];
        var tile2 = instance.tiles[t2];
        return tile2.subGraphSize - tile1.subGraphSize;
    }

    function addHintsConflict(x, y, d) {
        var tag = d % 2 == 0 ? 'T-B' : 'L-R';
        var edge_name = (d == 0 || d == 3) ? y + tag + x : x + tag + y; 
        instance.hintsConflict.add(edge_name);
    }

    function showStrongAndWeakHints(sureHints, strongHintsNeededTiles, indexes){
        var shouldSave = false;
        if (strongHintsNeededTiles.length == 0) {
            return shouldSave;
        }
        instance.hintsConflict.clear();
        instance.conflictGroupHasBeenMoveAway = false;
        var bidirectionLinks = countBidirectionLinks(sureHints);
        var weakHintsNeededTiles = new Array();
        strongHintsNeededTiles.sort(sortTile);
        while(strongHintsNeededTiles.length > 0){
            var index = strongHintsNeededTiles.shift();
            var tile = instance.tiles[index];
            for (var j = 0; j < 4; j++) {
                var hintTileIndex = sureHints[index][j];
                if (hintTileIndex < 0 || hintTileIndex == tile.aroundTiles[j]) {
                    continue;
                }
                if(tile.aroundTiles[j] >= 0){
                    addHintsConflict(index, hintTileIndex, j);
                    continue;
                }
                var hintTile = instance.tiles[hintTileIndex];
                if (hintTile.hasShowHint) {
                    continue;
                }
                if(bidirectionLinks[index].aroundTiles[j] && hintTile.noAroundTiles){
                    var shouldSaveThis = showHints(index, sureHints[index], j);
                    normalizeTiles(true);
                    shouldSave = shouldSave || shouldSaveThis;
                    if(tile.aroundTiles[j] >= 0){
                    strongHintsNeededTiles.push(hintTileIndex);
                    if (indexes) {
                        indexes.push(hintTileIndex);
                        }
                    }
                    if (shouldSaveThis) {
                        instance.realStepsCounted = false;
                    }
                } else {
                    weakHintsNeededTiles.push(index);
                    if (indexes) {
                        indexes.push(index);
                    }
                }
            }
        }
        weakHintsNeededTiles.sort(sortTile);
        for (var i = 0; i < weakHintsNeededTiles.length; i++) {
            var index = weakHintsNeededTiles[i];
            var tile = instance.tiles[index];
            for (var j = 0; j < 4; j++) {
                var hintTileIndex = sureHints[index][j];
                if (hintTileIndex < 0 || hintTileIndex == tile.aroundTiles[j]) {
                    continue;
                }
                if(tile.aroundTiles[j] >= 0){
                    addHintsConflict(index, hintTileIndex, j);
                    continue;
                }
                var hintTileIndex = sureHints[index][j];
                if (bidirectionLinks[index].aroundTiles[j]) {
                    var hintTile = instance.tiles[hintTileIndex];
                    if (hintTile.hasShowHint) {
                        continue;
                    }
                    var shouldSaveThis = showHints(index, sureHints[index], j);
                    normalizeTiles(true);
                    shouldSave = shouldSave || shouldSaveThis;
                    if (shouldSaveThis) {
                        instance.realStepsCounted = false;
                    }
                }
            }
        }
        return shouldSave;
    }

    function checkCorrectHints(tiles, hints){
        for (var i = 0; i < tiles.length; i++) {
            var tile = tiles[i];
            tile.hasShowHint = false;
            tile.hasCorrectLinks = false;
            for (var j = 0; j < tile.aroundTiles.length; j++) {
                if (tile.aroundTiles[j] >= 0 && tile.aroundTiles[j] == hints[i][j]) {
                    tile.hasCorrectLinks = true;
                    break;
                }
            }
        }
    }

    function showVulnerableEdges() {
        if (!instance.edgeMap) {
            return;
        }
        hideAllColorBorder();
        for (var i = 0; i < instance.tiles.length; i++) {
            var tile = instance.tiles[i];
            if (tile.aroundTiles[1] >= 0) {
                var edge = i + 'L-R' + tile.aroundTiles[1];
                if (instance.edgeMap[edge] && instance.edgeMap[edge].pro < 0.7) {
                    showUnsureHintColorWidth(i, tile.aroundTiles[1], 1, 0, true);
                }
            }
            if (tile.aroundTiles[2] >= 0) {
                var edge = i + 'T-B' + tile.aroundTiles[2];
                if (instance.edgeMap[edge] && instance.edgeMap[edge].pro < 0.7) {
                    showUnsureHintColorWidth(i, tile.aroundTiles[2], 2, 0, true);
                }
            }
        }
    }

    function computeEdgeProbability(edge_sup, edge_opp) {
        var edgeMap = {}
        if (edge_sup) {
            for (var i = 0; i < edge_sup.length; i += 2) {
                var edge = edge_sup[i];
                var val = parseInt(edge_sup[i+1]);
                edgeMap[edge] = {
                    sup: val,
                    opp: 0,
                    pro: 1
                }
            }
        }
        if (edge_opp) {
            for (var i = 0; i < edge_opp.length; i += 2) {
                var edge = edge_opp[i];
                var val = parseInt(edge_opp[i+1]);
                if(!edgeMap[edge]) {
                    edgeMap[edge] = {
                        sup: 0,
                        opp: val,
                        pro: 0
                    }
                } else {
                    edgeMap[edge].opp = val;
                    if (edgeMap[edge].opp + edgeMap[edge].sup > 0) {
                        edgeMap[edge].pro = edgeMap[edge].sup / (edgeMap[edge].opp + edgeMap[edge].sup);
                    }
                }
            }
        }
        return edgeMap;
    }

    function edgesToHints(edges) {
        var hints = new Array();
        for (var i = 0; i < instance.tilesNum; i++) {
            hints.push(new Array(-1, -1, -1, -1));
        }
        for (var i = 0; i < edges.length; i++) {
            var e = edges[i];
            if (instance.edgeMap[e] && Math.random() > instance.edgeMap[e].pro) {
                continue;
            }
            var splited = e.split('-');
            var x = parseInt(splited[0].slice(0, -1))
            var y = parseInt(splited[1].slice(1)) 
            var tag = splited[1][0] == 'R' ? 'L-R': 'T-B';
            if (tag == 'L-R') {
                hints[x][1] = y;
                hints[y][3] = x;
            } else {
                hints[x][2] = y;
                hints[y][0] = x; 
            }
        }
        return hints;
    }

    function sortPlayersByQuality(p1, p2){
        return p2.quality - p1.quality;
    }

    socket.on('distributed_proactiveHints', function(data) {
        instance.edgeMap = computeEdgeProbability(data.edge_sup, data.edge_opp);
        if (data.players && data.players.length > 0) {
            for (var i = 0; i < data.players.length; i++) {
                var sup = data.players[i].sup;
                var opp = data.players[i].opp;
                data.players[i].quality = 0;
                if (sup + opp > 0) {
                    data.players[i].quality = sup / (sup + opp);
                }
            }
            data.players.sort(sortPlayersByQuality);
            instance.singleArray = new Array();
            for (var i = 0; i < data.players.length; i++) {
                instance.hintedFrom = data.players[i].from;
                var hints = edgesToHints(data.players[i].edges);
                data.sureHints = hints;
                processProactiveHints(data);
                instance.hintedFrom = undefined;
            }
            if (instance.singleArray.length > 0) {
                instance.hintsShowing = true;
                for (var i = 0; i < instance.singleArray.length; i++) {
                    var single = instance.singleArray[i];
                    if (!single) {
                        continue;
                    }
                    var single = instance.singleArray[i];
                    var tile = single.tile;
                    tile.position = single.originPosition;
                }
            }
        }
        showVulnerableEdges();
    });

    socket.on('distributed_reactiveHints', function(data) {
        instance.edgeMap = computeEdgeProbability(data.edge_sup, data.edge_opp);
        if (data.players && data.players.length > 0) {
            for (var i = 0; i < data.players.length; i++) {
                var sup = data.players[i].sup;
                var opp = data.players[i].opp;
                data.players[i].quality = 0;
                if (sup + opp > 0) {
                    data.players[i].quality = sup / (sup + opp);
                }
            }
            data.players.sort(sortPlayersByQuality);
            instance.singleArray = new Array();
            for (var i = 0; i < data.players.length; i++) {
                instance.hintedFrom = data.players[i].from;
                var hints = edgesToHints(data.players[i].edges);
                data.sureHints = hints;
                
                processReactiveHints(data);

                instance.hintedFrom = undefined;
            }
            if (instance.singleArray.length > 0) {
                instance.hintsShowing = true;
                for (var i = 0; i < instance.singleArray.length; i++) {
                    var single = instance.singleArray[i];
                    if (!single) {
                        continue;
                    }
                    var tile = single.tile;
                    tile.position = single.originPosition;
                }
            }
        }
        showVulnerableEdges();
    });

    function processReactiveHints(data) {
        if (ctrlDown || data.sureHints.length == 0) {
            return;
        }
        var currentStep = data.currentStep;
        if (!mousedowned && currentStep == instance.steps) {
            instance.hintsShowing = true;
            instance.hintsShowingType = 'reactive';
            instance.hintsLog = {
                type: 'reactive',
                hints: JSON.stringify(data.sureHints),
                log: new Array(),
            };
            instance.hintAroundTilesMap = data.sureHints;

            checkCorrectHints(instance.tiles, instance.hintAroundTilesMap);

            var strongHintsNeededTiles = new Array();
            for (var i = 0; i < data.indexes.length; i++) {
                var index = data.indexes[i];
                var tile = instance.tiles[index];
                for (var j = 0; j < 4; j++) {
                    if (data.sureHints[index][j] > -1) {
                        strongHintsNeededTiles.push(index);
                        break;
                    }
                }
            }
            var shouldSave = showStrongAndWeakHints(data.sureHints, strongHintsNeededTiles, data.indexes);
            if (shouldSave) {
                instance.realStepsCounted = false;
                saveGame();
            }

            computeHintedSubGraph();
            normalizeTiles();

            // judge the hint tiles
            if (!instance.gameFinished) {
                var errors = checkTiles();
                if (errors == 0) {
                    finishGame();
                }
            }

            if (!shouldSave){
                processUnsureHints(data.unsureHints, data.selectedTileIndexes);
            }
            instance.hintsShowingType = 'reactive';
            instance.hintsShowing = false;
        }
    }

    //socket.on("reactiveHints", processReactiveHints);

    socket.on('reactiveHints', function(data) {
        instance.singleArray = new Array();
        processReactiveHints(data);
        if (instance.singleArray.length > 0) {
            instance.hintsShowing = true;
            for (var i = 0; i < instance.singleArray.length; i++) {
                var single = instance.singleArray[i];
                if (!single) {
                    continue;
                }
                var single = instance.singleArray[i];
                var tile = single.tile;
                tile.position = single.originPosition;
            }
        }
        if (data.edgeMap) {
            instance.edgeMap = data.edgeMap;
            showVulnerableEdges();
        }
    });

    function moveSelectedTilesAway(selectedTileIndex){
        if(instance.conflictGroupHasBeenMoveAway){
            return false;
        }
        instance.conflictGroupHasBeenMoveAway = true;

        var selectedTile = instance.tiles[selectedTileIndex];

        if(selectedTile.nodesCount > tilesPerRow * tilesPerColumn / 2){
            return false;
        }

        var groupTiles = new Array();

        DFSTiles(selectedTile, groupTiles, new Point(0, 0));

        var leftUpPoint = new Point(10000, 10000);
        var rightBottomPoint = new Point(-10000, -10000);
        for (var i = 0; i < groupTiles.length; i++) {
            var tile = groupTiles[i];
            var position = tile.position;
            if (position.x < leftUpPoint.x) {
                leftUpPoint.x = position.x;
            }
            if (position.y < leftUpPoint.y) {
                leftUpPoint.y = position.y;
            }
            if (position.x > rightBottomPoint.x) {
                rightBottomPoint.x = position.x;
            }
            if (position.y > rightBottomPoint.y) {
                rightBottomPoint.y = position.y;
            }
        }
        var groupCenterPoint = (leftUpPoint + rightBottomPoint)/2;

        var moveDir = groupCenterPoint - instance.centerPoint;
        if(moveDir.x != 0){
            moveDir.x = moveDir.x > 0 ? 1: -1;
        }
        if(moveDir.y != 0){
            moveDir.y = moveDir.y > 0 ? 1: -1;
        }

        var centerCellPosition = new Point(
            Math.round(groupCenterPoint.x / instance.tileWidth),//returns int closest to arg
            Math.round(groupCenterPoint.y / instance.tileWidth));
        var destination = centerCellPosition + moveDir * (tilesPerRow / 2);

        for (var i = 0; i < groupTiles.length; i++) {
            groupTiles[i].picking = true;
        }

        var hasConflicts = checkConflict(groupTiles, destination);
        var hasConflict = hasConflicts[0];
        var shouldSave = false;
        if (!hasConflict) {
            for (var i = 0; i < groupTiles.length; i++) {
                var tile = groupTiles[i];
                var tileIndex = getTileIndex(tile);
                var des = new Point(destination + tile.relativePosition);
                if (instance.singleArray[tileIndex]) {
                    var single = instance.singleArray[tileIndex];
                    single.destination = new Point(des);
                    single.desDiff = (des * instance.tileWidth -
                        single.originPosition) / single.times; 
                }
                placeTile(tile, des);
                shouldSave = shouldSave || tile.positionMoved;
                tile.relativePosition = new Point(0, 0);
                tile.picking = false;
            }
            if(shouldSave){
                var delta = moveDir * (tilesPerRow / 2) * instance.tileWidth;
                var currentScroll = view.currentScroll + delta * instance.currentZoom;
                view.scrollBy(currentScroll);
            }
            return shouldSave;
        }

        for (var i = 0; i < groupTiles.length; i++) {
            groupTiles[i].picking = false;
        }
        return shouldSave;
    }

    function showHints(selectedTileIndex, hintTiles, direction) {
        if (mousedowned || ctrlDown) {
            return false;
        }
        var tile = instance.tiles[selectedTileIndex];
        var selectedGroupTiles = new Array();
        DFSTiles(tile, selectedGroupTiles, new Point(0, 0));

        var shouldSave = false;

        var cellPosition = tile.cellPosition;

        if (!hintTiles) {
            return false;
        }

        var hintTilesCount = 0;
        for (var j = 0; j < hintTiles.length; j++) {
            if(direction >= 0 && j != direction){
                continue;
            }

            var correctTileIndex = hintTiles[j];
            if (correctTileIndex < 0) {
                instance.hintsLog.log.push({
                    tile: selectedTileIndex,
                    hint_tile: correctTileIndex,
                    direction: j,
                    success: false,
                    msg: 'hint_tile no exists'
                });
                continue;
            }

            if (tile.aroundTiles && tile.aroundTiles[j] >= 0) {
                instance.hintsLog.log.push({
                    tile: selectedTileIndex,
                    hint_tile: correctTileIndex,
                    direction: j,
                    success: false,
                    msg: 'tile already has aroundTile in direction ' + j
                });
                addHintsConflict(selectedTileIndex, correctTileIndex, j);
                continue;
            }


            if (tile.conflictTiles[correctTileIndex]) {
                instance.hintsLog.log.push({
                    tile: selectedTileIndex,
                    hint_tile: correctTileIndex,
                    direction: j,
                    success: false,
                    msg: 'hint_tile was remove by player before'
                });
                addHintsConflict(selectedTileIndex, correctTileIndex, j);
                continue;
            }

            var correctTile = instance.tiles[correctTileIndex];

            if (correctTile.picking) {
                instance.hintsLog.log.push({
                    tile: selectedTileIndex,
                    hint_tile: correctTileIndex,
                    direction: j,
                    success: false,
                    msg: 'hint_tile is picking by player'
                });
                continue;
            }

            if (correctTile.hasShowHint) {
                instance.hintsLog.log.push({
                    tile: selectedTileIndex,
                    hint_tile: correctTileIndex,
                    direction: j,
                    success: false,
                    msg: 'hint_tile is shown to others'
                });
                continue;
            }

            var correctCellposition = cellPosition + directions[j];

            var groupTiles = new Array();

            DFSTiles(correctTile, groupTiles, new Point(0, 0));


            var sameGroup = false;
            for (var i = 0; i < groupTiles.length; i++) {
                if (getTileIndex(groupTiles[i]) == selectedTileIndex) {
                    sameGroup = true;
                    break;
                }
            }

            if (sameGroup) {
                instance.hintsLog.log.push({
                    tile: selectedTileIndex,
                    hint_tile: correctTileIndex,
                    direction: j,
                    success: false,
                    msg: 'tile and hint_tile are in the same group'
                });
                //addHintsConflict(selectedTileIndex, correctTileIndex, j);
                continue;
            }

            for (var i = 0; i < groupTiles.length; i++) {
                groupTiles[i].picking = true;
            }

            var hasConflicts = checkConflict(groupTiles, correctCellposition, selectedGroupTiles);
            var hasConflict = hasConflicts[0];
            var needToMove = hasConflicts[1];
            if(hasConflict && needToMove){
                var moveAwayShouldSave = moveSelectedTilesAway(selectedTileIndex);
                shouldSave = shouldSave || moveAwayShouldSave;
                cellPosition = instance.tiles[selectedTileIndex].cellPosition;
                correctCellposition = cellPosition + directions[j];
                hasConflicts = checkConflict(groupTiles, correctCellposition, selectedGroupTiles);
                hasConflict = hasConflicts[0];
                needToMove = hasConflicts[1];
            }

            /*
            if (hasConflict && correctTile.allLinksHinted && !correctTile.hasCorrectLinks) {
                for (var i = 0; i < groupTiles.length; i++) {
                    groupTiles[i].picking = false;
                }

                groupTiles = new Array();
                groupTiles.push(correctTile);
                for (var i = 0; i < groupTiles.length; i++) {
                    groupTiles[i].picking = true;
                }
                hasConflicts = checkConflict(groupTiles, correctCellposition);
                hasConflict = hasConflicts[0];
                needToMove = hasConflicts[1];
            }
            */

            if (hasConflict) {
                instance.hintsLog.log.push({
                    tile: selectedTileIndex,
                    hint_tile: correctTileIndex,
                    direction: j,
                    success: false,
                    msg: 'hint_tile has conflict when put into place'
                });
                //addHintsConflict(selectedTileIndex, correctTileIndex, j);
                continue;
            }

            checkHints(selectedTileIndex, j, correctTileIndex);

            for (var i = 0; i < groupTiles.length; i++) {
                var hintTile = groupTiles[i];
                var hintTileIndex = getTileIndex(hintTile);
                var des = correctCellposition + hintTile.relativePosition;

                /*
                if (instance.singleArray[hintTileIndex]) {
                    var single = instance.singleArray[hintTileIndex];
                    single.desDiff = (des * instance.tileWidth - 
                        single.originPosition) / single.times;
                    single.destination = new Point(des);
                } else {
                    instance.singleArray[hintTileIndex] = {
                        originPosition: new Point(hintTile.position),
                        tile: hintTile,
                        destination: new Point(des),
                        times: moveAnimationTime,
                        desDiff: (des * instance.tileWidth - 
                            hintTile.position) / moveAnimationTime
                    }
                }
                */

                placeTile(hintTile, des);
                if (hintTile.positionMoved) {
                    instance.hintedTilesMap[getTileIndex(hintTile)] = true;
                }
                shouldSave = shouldSave || hintTile.positionMoved;
                hintTile.relativePosition = new Point(0, 0);
                hintTile.alreadyHinted = true;
                hintTile.picking = false;
            }
            for (var i = 0; i < groupTiles.length; i++) {
                var hintTile = groupTiles[i];
                refreshAroundTiles(hintTile, true);
                hintTile.picking = false;
                hintTile.hasShowHint = true;
            }
            instance.hintsLog.log.push({
                tile: selectedTileIndex,
                hint_tile: correctTileIndex,
                direction: j,
                success: true,
                msg: "recomment " + groupTiles.length + " tiles"
            });

            hintTilesCount += groupTiles.length;

        }
        if (hintTilesCount) {
            tile.alreadyHinted = true;
        }

        return shouldSave;
    }

    function getTileAtCellPosition(cellPosition) {
        var roundPosition = cellPosition * instance.tileWidth;
        var retTile = undefined;
        var hitResults = project.hitTestAll(roundPosition);
        for (var i = 0; i < hitResults.length; i++) {
            var hitResult = hitResults[i];
            if (hitResult.type != "pixel") {
                continue;
            }
            var img = hitResult.item;
            var tile = img.parent.parent;
            if (!tile.picking) {
                retTile = tile;
            }
        }
        return retTile;
    }
    this.animation_turn = 0;
    this.animation = function () {
        this.animation_turn += 1;
        this.animation_turn %= 2;
        if (this.animation_turn) {
            return;
        }
        var changeOpacity = function (path) {
            var speed = 0.05;
            var upperBound = 0.7;
            var lowwerBound = 0.1;
            if (path.reverse) {
                path.opacity += speed;
                if (path.opacity >= upperBound) {
                    path.reverse = false;
                }
            }
            else {
                path.opacity -= speed;
                if (path.opacity <= lowwerBound) {
                    path.reverse = true;
                }
            }
        }
        if (!instance.tiles) {
            return;
        }
        for (var i = 0; i < instance.tiles.length; i++) {
            var tile = instance.tiles[i];
            if (!tile) {
                continue;
            }

            if (tile.differentColor.length > 0) {
                for (var j = 0; j < tile.differentColor.length; j++) {
                    var edgeIndex = tile.differentColor[j];
                    switch (edgeIndex) {
                        case 0:
                            //tile.topEdge.strokeColor.hue += 1;
                            changeOpacity(tile.topEdge);
                            break;
                        case 1:
                            //tile.rightEdge.strokeColor.hue += 1;
                           changeOpacity(tile.rightEdge);
                           break;
                        case 2:
                            //tile.bottomEdge.strokeColor.hue += 1;
                           changeOpacity(tile.bottomEdge);
                           break;
                        case 3:
                            //tile.leftEdge.strokeColor.hue += 1;
                            changeOpacity(tile.leftEdge);
                            break;
                        default:
                            //tile.colorBorder.strokeColor.hue += 1;
                            changeOpacity(tile.colorBorder);
                            break;
                    }
                }
            }
        }
        if (instance.groupsArray && instance.groupsArray.length > 0) {
            var groupsArray = instance.groupsArray;
            var done = true;
            for (var i = 0; i < groupsArray.length; i++) {
                var group = groupsArray[i];
                if (!group || group.times == 0) {
                    continue;
                }
                group.times -= 1;
                done = (group.times == 0);
                for (var j = 0; j < group.groupTiles.length; j++) {
                    var tile = group.groupTiles[j];
                    tile.position += group.desDiff;

                }
            }
            if (done) {
                for (var i = 0; i < groupsArray.length; i++) {
                    var group = groupsArray[i];
                    if (!group) {
                        continue;
                    }
                    for (var j = 0; j < group.groupTiles.length; j++) {
                        var tile = group.groupTiles[j];
                        placeTile(tile, group.destination + tile.relativePosition);
                    }
                }
                normalizeTiles();
                instance.hintsShowing = false;
                instance.groupsArray = undefined;
            }
        }
    }

    this.dragTile = function (delta, ctrl) {
        if (instance.draging && instance.selectedTile && instance.selectedTile.length > 0) {
            var centerPosition = instance.selectedTile[0].position;
            if (instance.selectedTile[0].differentColor.length > 0) {
                hideColorBorder(getTileIndex(instance.selectedTile[0]));
            }
            else {
                hideAllColorBorder();
            }
            for (var i = 0; i < instance.selectedTile.length; i++) {
                var tile = instance.selectedTile[i];
                tile.opacity = 1;
                tile.position = centerPosition + tile.relativePosition * instance.tileWidth + delta;
            }
            instance.ctrlDrag = ctrl;
        }
        else if(!ctrl) {
            var currentScroll = view.currentScroll - delta * instance.currentZoom;
            view.scrollBy(currentScroll);
            view.currentScroll = currentScroll;
        }
    }

    function DFSTiles(tile, array, relativePosition) {
        for (var i = 0; i < array.length; i++) {
            if (array[i] == tile)
                return;
        }
        tile.relativePosition = relativePosition;
        tile.originPosition = tile.cellPosition;
        array.push(tile);
        for (var i = 0; i < 4; i++) {
            var newTileIndex = tile.aroundTiles[i];
            if (newTileIndex >= 0) {
                var newTile = instance.tiles[newTileIndex];
                DFSTiles(newTile, array, relativePosition + directions[i]);
            }
        }
    }

    function resetplaceDFSTiles(tile, array, relativePosition) {
        if(tile.picking == true)
            return;
        tile.relativePosition = relativePosition;
        tile.picking = true;
        array.push(tile);
        for (var i = 0; i < 8; i++) {
            var newTile = getTileAtCellPosition(tile.cellPosition + resetplaceDirctions[i]);
            if (newTile != undefined) {
                resetplaceDFSTiles(newTile, array, relativePosition+resetplaceDirctions[i]);
            }
        }
    }

    function findSelectTile(point, selectedTile) {
        var cellPosition = new Point(
            Math.round(point.x / instance.tileWidth),//returns int closest to arg
            Math.round(point.y / instance.tileWidth));
        var hitResult = project.hitTest(point);
        var finded = false;
        if (!hitResult || hitResult.type != "pixel") {
            return finded;
        }
        var img = hitResult.item;
        var tile = img.parent.parent;
        if (tile && tile.name) {
            if (!tile.picking) {
                finded = true;
                if (instance.dragMode == "tile-First") {
                    if (selectedTile.length == 0) {
                        tile.relativePosition = new Point(0, 0);
                    }
                    else{
                        tile.relativePosition = tile.cellPosition - selectedTile[0].cellPosition;
                    }
                    selectedTile.push(tile);
                }
                else {
                    if (!tile.relativePosition) {
                        tile.relativePosition = new Point(0, 0);
                    }
                    DFSTiles(tile, selectedTile, tile.relativePosition);
                }
            }
        }
        return finded;
    }

    this.dragTileOrTiles = function () {
        if (instance.dragMode == "tile-First") {
            instance.dragDFSTile();
        }
        else {
            instance.dragOnlyTile();
        }
    }

    this.dragOnlyTile = function () {
        if (instance.selectedTile) {
            for (var i = 1; i < instance.selectedTile.length; i++) {
                instance.selectedTile[i].opacity = 0.5;
                instance.selectedTile[i].picking = false;
            }
            var tile = instance.selectedTile[0];
            instance.selectedTile = new Array();
            instance.selectedTile.push(tile);
        }
    }

    this.dragDFSTile = function () {
        if (instance.selectedTile) {
            var tile = instance.selectedTile[0];
            instance.selectedTile = new Array();
            DFSTiles(tile, instance.selectedTile, new Point(0, 0));
            for (var i = 0; i < instance.selectedTile.length; i++) {
                instance.selectedTile[i].opacity = 0.5;
                instance.selectedTile[i].picking = instance.selectedTile[0].picking;
            }
        }
    }

    this.zoom = function (zoomDelta) {
        var newZoom = instance.currentZoom + zoomDelta;
        if (newZoom >= 0.2 && newZoom <= 5) {
            view.zoom = instance.currentZoom = newZoom;
        }
    }

    function checkTiles() {
        var errors = 0;
        var firstTile = instance.tiles[0];
        var firstCellPosition = firstTile.cellPosition;

        for (var y = 0; y < instance.tilesPerColumn; y++) {
            for (var x = 0; x < instance.tilesPerRow; x++) {
                var index = y * instance.tilesPerRow + x;
                var cellPosition = instance.tiles[index].cellPosition;

                if (cellPosition != firstCellPosition + new Point(x, y)) {
                    errors++;
                }
            }
        }

        return errors;
    }

    this.showLastResult = function () {
        var visible = instance.puzzleImage.visible;
        for (var i = 0; i < instance.tiles.length; i++) {
            instance.tiles[i].visible = visible;
        }
        instance.puzzleImage.visible = !visible;
    }

    this.toggleShareInfo = function () {
        for (var i = 0; i < instance.tiles.length; i++) {
            var tile = instance.tiles[i];
            computeSubGraph(tile);
        }
        computeGraphData();
        instance.shareInfoToggle = true;
        saveGame();
    }

    function saveGame() {
        if (roundID < 0) {
            return;
        }
        var tilePositions = new Array();
        var tileHintedLinks = new Array();
        var tileLinksFrom = new Array();
        var tileLinkSteps = new Array();
        for (var i = 0; i < instance.tiles.length; i++) {
            var tile = instance.tiles[i];
            var tilePos = {
                index: i,
                subGraphSize: tile.subGraphSize,
                nodesCount: tile.nodesCount,
                x: tile.cellPosition.x,
                y: tile.cellPosition.y,
            };
            tilePositions.push(tilePos);
            tileHintedLinks.push(tile.hintedLinks);
            tileLinkSteps.push(tile.linkSteps);
            tileLinksFrom.push(tile.linksFrom);
        }

        socket.emit('saveGame', {
            round_id: roundID,
            player_name: player_name,
            steps: instance.steps,
            realSteps: instance.realSteps,
            time: time,
            startTime: startTime,
            maxSubGraphSize: instance.maxSubGraphSize,
            tiles: JSON.stringify(tilePositions),
            tileHintedLinks: JSON.stringify(tileHintedLinks),
            tileLinkSteps: JSON.stringify(tileLinkSteps),
            tileLinksFrom: JSON.stringify(tileLinksFrom),
            totalHintsNum: totalHintsNum,
            correctHintsNum: correctHintsNum,
            conflictEdgesTimesMap: JSON.stringify(instance.conflictEdgesTimesMap),
            shareInfoToggle: instance.shareInfoToggle,

        });
    }

    socket.on('loadGameSuccess', function (data) {
        if (data.username == player_name) {
            if(!data.gameData){
                createAndPlaceTiles(true);
                return;
            }
            var gameData = data.gameData;
            var needIntro = !gameData.round_id;
            if (gameData.round_id == roundID) {
                $.amaran({
                    'title': 'loadGame',
                    'message': 'Progress loaded.',
                    'inEffect': 'slideRight',
                    'cssanimationOut': 'zoomOutUp',
                    'position': "top right",
                    'delay': 2000,
                    'closeOnClick': true,
                    'closeButton': true
                });
                startTime = gameData.startTime;
                instance.maxSubGraphSize = gameData.maxSubGraphSize;
                instance.steps = gameData.steps;
                instance.realSteps = gameData.realSteps;
                document.getElementById("steps").innerHTML = instance.realSteps;
                instance.saveTilePositions = JSON.parse(gameData.tiles);
                instance.saveHintedLinks = JSON.parse(gameData.tileHintedLinks);
                instance.saveLinksFrom = JSON.parse(gameData.tileLinksFrom);
                instance.saveLinkSteps = JSON.parse(gameData.tileLinkSteps);
                totalHintsNum = gameData.totalHintsNum;
                correctHintsNum = gameData.correctHintsNum;

                if (gameData.time) {
                    time = gameData.time;
                }

                if(gameData.conflictEdgesTimesMap) {
                    instance.conflictEdgesTimesMap = JSON.parse(gameData.conflictEdgesTimesMap);
                }
                instance.shareInfoToggle = gameData.shareInfoToggle || false;

            }
            createAndPlaceTiles(needIntro);
        }
    });
    function loadGame() {
        socket.emit('loadGame', {username: player_name});
    }

    /*
    *找到位置并聚拢
    */
    function clusterTile(group,centerx,centery,disRatio,isCenter) {
        var centerCellPositionX = Math.round(centerx/instance.tileWidth);
        var centerCellPositionY = Math.round(centery/instance.tileWidth);
        var origindis = group.dis;
        var newdis = 0;

        var dx = 0;
        var dy = 0;
        var prex = group.x;
        var prey = group.y;
        var firstTile = group.groupTiles[0];

        for(var k=0;k<group.groupTiles.length;k++){
            group.groupTiles[k].originPosition = group.groupTiles[k].cellPosition;
        }
        //已经在中间了
        if(Math.abs(prex-centerCellPositionX)<=1 && Math.abs(prey-centerCellPositionY)<=1 || isCenter == true){     
            group.destination = firstTile.position/instance.tileWidth;
            group.times = 60;
            group.desDiff = (group.destination * instance.tileWidth - 
                group.groupTiles[0].position) / group.times;
            return;
        }
        //移动方向
        if(group.xdis<0){
            //dx = 45*group.cosa;
            dx = 64 * group.cosa;
        }else if(group.xdis>0){
            //dx = -45*group.cosa;
            dx = -64 * group.cosa;
        }else{
            dx=0;
        }
        if(group.ydis<0){
            //dy = 45*group.sina;
            dy= 64 * group.sina;
        }else if(group.ydis>0){
            //dy = -45*group.sina;
            dy=-64 * group.sina;
        }else{
            dy = 0;
        }
        var desx = prex;
        var desy = prey;
        var des = new Point(desx,desy);

        var offsetdx = 0;
        var offsetdy = 0;
        var rawoffsetx = 0;
        var rawoffsety = 0;
        var isConflicted = false;

        //尝试
        while(isConflicted != true){
            prex = desx;
            prey = desy;
            if(Math.abs(desx-centerCellPositionX)<=1 && Math.abs(desy-centerCellPositionY)<=1){
                break;
            }
            rawoffsetx = offsetdx;
            rawoffsety = offsetdy;
            offsetdx +=dx;
            offsetdy +=dy;
            desx = Math.round((group.x*instance.tileWidth+offsetdx)/instance.tileWidth);
            desy = Math.round((group.y*instance.tileWidth+offsetdy)/instance.tileWidth);
            var newdis = Math.sqrt((desx*instance.tileWidth-centerx)*(desx*instance.tileWidth-centerx)+(desy*instance.tileWidth-centery)*(desy*instance.tileWidth-centery));
            if(newdis>origindis){
                break;
            }
            origindis = newdis;
            isConflicted = checkResetPlaceConflict(group.groupTiles,new Point(Math.round((firstTile.position.x+offsetdx)/instance.tileWidth),
                Math.round((firstTile.position.y+offsetdy)/instance.tileWidth)));
        }
        des.x = Math.round((group.groupTiles[0].position.x+rawoffsetx)/instance.tileWidth);
        des.y = Math.round((group.groupTiles[0].position.y+rawoffsety)/instance.tileWidth);;
        group.destination = des;
        group.times = 60;
        group.desDiff = (group.destination * instance.tileWidth - 
                group.groupTiles[0].position) / group.times;
        //放置合法拼图块
        for(var k=0;k<group.groupTiles.length;k++){ 
            prePlaceTile(group.groupTiles[k],new Point(Math.round((group.groupTiles[k].position.x+rawoffsetx)/instance.tileWidth),
                Math.round((group.groupTiles[k].position.y+rawoffsety)/instance.tileWidth)));
        }  

    }
    
    this.resetPlace = function () {
        normalizeTiles();
        instance.hintsShowing = true;

        var groupsArray = new Array();
        var minCenterDis = null;
        var minCenterGroup = null;
        var maxGroupNum = 0;
        var maxGroupleftTopPoint = null;
        var maxGrouprightBottomPoint = null;

        for (var i = 0; i < instance.tiles.length; i++) {
            var tile = instance.tiles[i];
            if (tile.picking) {
                continue;
            }
            var groupTiles = new Array();
            resetplaceDFSTiles(tile, groupTiles, new Point(0, 0));

            var links = 0;
            var leftTopPoint = new Point(groupTiles[0].cellPosition.x, 
                groupTiles[0].cellPosition.y);
            var rightBottomPoint = new Point(groupTiles[0].cellPosition.x, 
                groupTiles[0].cellPosition.y);
            var diff = new Point(0, 0);
            for (var j = 0; j < groupTiles.length; j++) {
                var gt = groupTiles[j]; 
                gt.picking = true;
                diff.x = Math.min(diff.x, gt.relativePosition.x);
                diff.y = Math.min(diff.y, gt.relativePosition.y);
                leftTopPoint.x = Math.min(leftTopPoint.x, gt.cellPosition.x);
                leftTopPoint.y = Math.min(leftTopPoint.y, gt.cellPosition.y);
                rightBottomPoint.x = Math.max(rightBottomPoint.x, gt.cellPosition.x);
                rightBottomPoint.y = Math.max(rightBottomPoint.y, gt.cellPosition.y);
            }
            if(maxGroupNum<groupTiles.length){
                maxGroupNum = groupTiles.length;
                maxGroupleftTopPoint = leftTopPoint;
                maxGrouprightBottomPoint = rightBottomPoint;
            }

            var nodes = groupTiles.length;
            links /= 2;
            var minCenterDisX = (leftTopPoint.x + rightBottomPoint.x) / 2 * instance.tileWidth - instance.centerPoint.x;
            var minCenterDisY = (leftTopPoint.y + rightBottomPoint.y) / 2 * instance.tileWidth - instance.centerPoint.y;
            var minCenterDisX
            var idxMinCenterDis = Math.sqrt(minCenterDisX * minCenterDisX + minCenterDisY * minCenterDisY);
            var group = {
                nodes: nodes,
                links: links,
                ratio: links * links / nodes,
                groupTiles: groupTiles,
                width: rightBottomPoint.x - leftTopPoint.x + 1, 
                height: rightBottomPoint.y - leftTopPoint.y + 1,
                x: (leftTopPoint.x + rightBottomPoint.x) / 2,
                y: (leftTopPoint.y + rightBottomPoint.y) / 2,
                offset: new Point(0, 0),
                leftTopPoint: leftTopPoint,
                rightBottomPoint: rightBottomPoint,
                xdis: minCenterDisX,
                ydis: minCenterDisY,
                cosa:idxMinCenterDis==0?0:Math.abs(minCenterDisX)/idxMinCenterDis,
                sina:idxMinCenterDis==0?0:Math.abs(minCenterDisY)/idxMinCenterDis,
                dis: idxMinCenterDis,
                puzzleCenterdis:idxMinCenterDis,
                isCenter:false
            };
            groupsArray.push(group);
        }

        var width = instance.puzzleImage.size.width;
        var height = instance.puzzleImage.size.height;
        for(var i = 0; i < instance.tiles.length; i++){
            instance.tiles[i].picking = false;   
        }

        var centerGroup = new Array();
        for(var i=0;i<groupsArray.length;i++){
            if(groupsArray[i].groupTiles.length == maxGroupNum){
                centerGroup.push(groupsArray[i]);
            }
        }
        centerGroup.sort(function (a,b){
            return a.puzzleCenterdis - b.puzzleCenterdis;
        });
        centerGroup[0].isCenter = true;
        
        var clusterCenter = new Point(0,0);

        clusterCenter.x = centerGroup[0].x;
        clusterCenter.y = centerGroup[0].y;
        for(var i=0;i<groupsArray.length;i++){
            groupsArray[i].xdis = (groupsArray[i].x-clusterCenter.x)*instance.tileWidth;
            groupsArray[i].ydis = (groupsArray[i].y-clusterCenter.y)*instance.tileWidth;
            groupsArray[i].dis = Math.sqrt(groupsArray[i].xdis * groupsArray[i].xdis + groupsArray[i].ydis * groupsArray[i].ydis);
            groupsArray[i].cosa = (groupsArray[i].dis==0?0:Math.abs(groupsArray[i].xdis)/groupsArray[i].dis);
            groupsArray[i].sina = (groupsArray[i].dis==0?0:Math.abs(groupsArray[i].ydis)/groupsArray[i].dis);
        }
        groupsArray.sort(function (a, b) {
            return a.dis - b.dis;
        });

        var disRatio = 1;
        for(var i=0;i<groupsArray.length;i++){
            for(var k=0;k<groupsArray[i].groupTiles.length;k++){
                groupsArray[i].groupTiles[k].picking = true;
            }
            if(i>0){
                disRatio = (groupsArray[i-1].dis==0?1:groupsArray[i].dis / groupsArray[i-1].dis);
            }
            clusterTile(groupsArray[i],clusterCenter.x*instance.tileWidth,clusterCenter.y*instance.tileWidth,disRatio,groupsArray[i].isCenter);
            for(var k=0;k<groupsArray[i].groupTiles.length;k++){
                groupsArray[i].groupTiles[k].picking = false;
            }
        }
        
         for(var i = 0; i < instance.tiles.length; i++){
            instance.tiles[i].position = instance.tiles[i].originPosition*instance.tileWidth;
        }
        
        instance.groupsArray = groupsArray;
        instance.centerPoint = clusterCenter*instance.tileWidth;
        instance.focusToCenter();
        //normalizeTiles();
    }
}
/**
 * Game Finish
 */
(function () {
    if(players_num == 0){
        $('.rating-body').css('display', 'none');
    }
    else{
        $('#apply-button').attr('disabled',"true");
        $('#submit-button').attr('disabled',"true");
        $('.rb-rating').rating({
            'showCaption': false,
            'showClear': false,
            'stars': '5',
            'min': '0',
            'max': '5',
            'step': '0.5',
            'size': 'xs',
            // 'starCaptions': { 0: 'NO', 1: 'Too Bad', 2: 'Little Help', 3: 'Just So So', 4: 'Great Help', 5: 'Excellent!' }
        });
        $('.rb-rating').change(function (event){
            $('#apply-button').removeAttr("disabled");
            $('#submit-button').removeAttr("disabled");
        })
    }
    $('#submit-button').click(function (event) {
        // player's rating for the hint(what he thinks about the function)
        var rating = $("#rating2").val();
        sendRecord(true, rating);
        if (roundID >= 0) {
            var extraData = {
                rating: rating,
                nextGame: $('#next_game_yes2').prop("checked"), 
                reason: $('#next_game_reason2').val(),
            }
            socket.emit('survey', {
                round_id:roundID,
                player_name: player_name,
                survey_type: 'endgame',
                extra: JSON.stringify(extraData),
            });
            quitRound(roundID);
        }
        else {
            window.location = '/home';
        }
    });
    $('#survey-button').click(function (event) {
        // player's rating for the hint(what he thinks about the function)
        
    });

    $('#quit').click(function (event) {
        $('#quitLabel').text('Are You Sure to Quit?');
        $('#ensure_quit_dialog').modal({
            keyboard: true
        });
    });

    $('#apply-button').click(function (event) {
        var rating = $("#rating").val();
        sendRecord(false, rating);
        if (roundID >= 0) {
            var extraData = {
                rating: rating,
                nextGame: $('#next_game_yes').prop("checked"), 
                reason: $('#next_game_reason').val(),
            }
            socket.emit('survey', {
                round_id:roundID,
                player_name: player_name,
                survey_type: 'endgame',
                extra: JSON.stringify(extraData),
            });
            quitRound(roundID);
        }
        else {
            window.location = '/home';
        }
    });
}());


$('#undo_button').on('click', function (event) {
    if (puzzle.steps != undoStep) {
        puzzle.undoNextStep();
    }
});

$('#guess_button').on('click', function (event) {
    $('#guess_dialog').modal();
    socket.emit('survey', {
        round_id:roundID,
        player_name: player_name,
        survey_type: 'guessClick',
    });
});

$('#guess-submit-button').on('click', function (event) {
    socket.emit('survey', {
        round_id:roundID,
        player_name: player_name,
        survey_type: 'guess',
        extra: $('#guess_content').val(),
    });
    $('#guess_dialog').modal('hide');
})

$('#share_button').on('click', function (event) {
    $('#share_toggle_dialog').modal();
});

$('#pregame-survey-button').on('click', function (event) {
    var extraData = {
        wantToShare: $('#share_info_yes').prop("checked"), 
        reason: $('#share_info_reason').val(),
    }
    socket.emit('survey', {
        round_id:roundID,
        player_name: player_name,
        survey_type: 'pregame',
        extra: JSON.stringify(extraData),
    });
    $('#pregame_survey').modal('hide');
    showIntro();
});

$('#share-toggle-button').on('click', function (event) {
    puzzle.toggleShareInfo();
    socket.emit('survey', {
        round_id:roundID,
        player_name: player_name,
        survey_type: 'shareInfo'
    });
    $('#share_button').css('display', 'none');
    $('#share_toggle_dialog').modal('hide');
});

var resetPlaceStep = 0;
$('#reset_button').on('click', function (event) {
    if (puzzle.steps === resetPlaceStep) {
        $.amaran({
            'title': 'Warning',
            'message': 'Too frequent!',
            'inEffect': 'slideRight',
            'cssanimationOut': 'zoomOutUp',
            'position': "top right",
            'delay': 2000,
            'closeOnClick': true,
            'closeButton': true
        });
        return;
    }
    resetPlaceStep = puzzle.steps;
    $('#undo_button').css('display', 'none');
    $('#showhints_msgLabel').text('1分钟内拼图块将聚拢。如果超过1分钟仍无响应，请关闭网页重新打开。');
    $('#show_hints_dialog').modal({
        keyboard: false,
        backdrop: 'static',
    });
    setTimeout(function () {
        puzzle.resetPlace();
        $('#show_hints_dialog').modal('hide');
    }, 500);
});

$('#quit_button').on('click', function (event) {
    $('#quitLabel').text('Are You Sure to Quit?');
    $('#ensure_quit_dialog').modal({
        keyboard: true
    });
});

$('#zoomin_button').on('click', function () {
    puzzle.zoom(.1);
});

$('#zoomout_button').on('click', function () {
    puzzle.zoom(-.1);
});


$('#center_button').on('click', function () {
    puzzle.focusToCenter();
});

$('#help_button').on('click', function (event) {
    puzzle.askHelp();
});

$('.menu_png img').mousedown(function () {
    $(this).css("background-color", "rgba(200, 200, 200, 0.9)")
});

$('.menu_png img').mouseup(function () {
    $(this).css("background-color", "rgba(200, 200, 200, 0)")
});

$('.menu_png img').mouseover(function () {
    $(this).css("background-color", "rgba(200, 200, 200, 0.9)")
});

$('.menu_png img').mouseout(function () {
    $(this).css("background-color", "rgba(200, 200, 200, 0)")
});


/**
 * Send personal records to the server at the end of one game
 */
function sendRecord(finished, rating) {
    if (roundID < 0) {
        return;
    }
    puzzle.calcHintedTile();
    var edges = puzzle.generateEdges();
    var params = {
        round_id: roundID,
        player_name: player_name,
        finished: finished,
        steps: puzzle.realSteps,
        startTime: startTime,
        totalLinks: hintedLinksNum.totalLinks,
        hintedLinks: hintedLinksNum.hintedLinks,
        correctLinks: hintedLinksNum.correctLinks,
        hintedSteps: hintedLinksNum.hintedSteps,
        totalSteps: hintedLinksNum.totalSteps,
        totalHintsNum: totalHintsNum,
        correctHintsNum: correctHintsNum,
        rating: rating,
        edges: edges
    };
    if (!finished) {
        var randomTime = Math.random() * 1000;
        setTimeout(function(){
            socket.emit('saveRecord', params);
        }, randomTime);
    }
    else {
        socket.emit('saveRecord', params);
    }
}

function quitRound(roundID) {
    if (roundID < 0) {
        return;
    }
    if(players_num == 1){
        socket.emit('quitRound', {round_id:roundID, username: player_name});
    }
    else{
        $('#quitLabel').text('Quiting...');
        $('#msgLabel').text('Quiting...');
        $('.rating-body').css('display', 'none');
        $('#apply-button').attr('disabled',"true");
        $('#submit-button').attr('disabled',"true");
        $('#cancel-button').attr('disabled',"true");
        socket.emit('quitRound', {round_id:roundID, username: player_name});
    }
}


if(solved_players >= 3){
    puzzle.forceLeave('More than 3 Players Have Finished the Puzzle. Send record.');
}


$(document).ready(function(e) { 
    var counter = 0;
    if (window.history && window.history.pushState) {
        $(window).on('popstate', function () {
            window.history.pushState('forward', null, '#');
            window.history.forward(1);
            $('#quitLabel').text('Are You Sure to Quit?');
            $('#ensure_quit_dialog').modal({
                keyboard: true
            });
        });
    }
 
    window.history.pushState('forward', null, '#'); //在IE中必须得有这两行
    window.history.forward(1);
});

function showIntro() {
    introJs().setOptions({
        steps: [
            {
                element: '#share_button',
                intro: "点击选择是否分享拼图信息给他人"
            },
            {
                element: '#guess_button',
                intro: "点击猜测拼图图片内容"
            },
        ],
        scrollToElement: false,
        exitOnOverlayClick: false,
        exitOnEsc: false,
    }).start();
}