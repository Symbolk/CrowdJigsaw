var requrl = window.location.protocol + '//' + window.location.host + '/';
var loadReady = false;
var socket = io.connect(requrl);


$(document).ready(function () {
    loadReady = true;
});
while (!(loadReady)) {
    continue;
}
$("#loading").fadeOut();
/*
* Drawer functions
*/
$('.zoomIn').click(function () {
    puzzle.zoom(.1);
});

$('.zoomOut').click(function () {
    puzzle.zoom(-.1);
});

// $('.help').mousedown(function () {
//     puzzle.showLastResult();
// });

$('.restart').click(function () {
    // document.execCommand('Refresh');
    window.location.reload();
    // var puzzle = new JigsawPuzzle(config);
});

$('.returnCenter').click(function () {
    view.scrollBy(new Point(560, 360) - view.center);
});

// $('.roundRank').click(function () {

// $.ajax({
//     url: requrl + 'round' + '/getRoundRank/' + roundID,
//     type: 'get',
//     dataType: 'json',
//     cache: false,
//     timeout: 5000,
//     success: function (data) {
//         // window.location = '/roundrank';
//         console.log(data);
//     },
//     error: function (jqXHR, textStatus, errorThrown) {
//         console.log('error ' + textStatus + " " + errorThrown);
//     }
// });
// }); 

// round rank as dialog
(function () {
    var showButton = document.querySelector('.roundRank');
    var dialog = document.querySelector('#roundRank_dialog');
    var closeButton = document.querySelector('#close-button');

    if (!dialog.showModal) {
        dialogPolyfill.registerDialog(dialog);
    }

    closeButton.addEventListener('click', function (event) {
        var ranklist = document.getElementById("ranklist");
        var table = document.getElementById("ranktable");
        ranklist.removeChild(table);
        dialog.close();
    });

    showButton.addEventListener('click', function (event) {
        $.ajax({
            url: requrl + 'round' + '/getRoundRank/' + roundID,
            type: 'get',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (data) {
                // $("#round-rank").css("display", "block");
                // $("#round-rank").toggle();
                // $("#rank-table").bootstrapTable({
                //     data: data.AllPlayers
                // });
                // $('.roundRank-dialog-text').text(data.AllPlayers); 
                var ranklist = document.getElementById("ranklist");
                var table = document.createElement("table");//创建table 
                table.id = "ranktable";
                var row = table.insertRow();
                var rank = row.insertCell();
                rank.width = "150";
                rank.innerHTML = "Rank";
                var name = row.insertCell();
                name.width = "150";
                name.innerHTML = "Name";
                var contri = row.insertCell();
                rank.width = "150";
                contri.innerHTML = "Contribution";


                for (var i = 0; i < data.AllPlayers.length; i++) {
                    var row = table.insertRow();//创建一行 
                    var rank = row.insertCell();//创建一个单元 
                    rank.width = "150";//更改cell的各种属性 
                    rank.innerHTML = i;
                    var name = row.insertCell();//创建一个单元                     
                    name.innerHTML = data.AllPlayers[i].player_name;
                    var contri = row.insertCell();//创建一个单元                     
                    contri.innerHTML = data.AllPlayers[i].contribution;
                }
                ranklist.appendChild(table);
                dialog.showModal();
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log('error ' + textStatus + " " + errorThrown);
            }
        });
    });
}());

/**
 * Ensure quit
 */
(function () {
    var showButton = document.querySelector('#ensure_quit');
    var dialog = document.querySelector('#ensure_quit_dialog');
    var cancelButton = document.querySelector('#cancel-button');
    var applyButton = document.querySelector('#apply-button');

    if (!dialog.showModal) {
        dialogPolyfill.registerDialog(dialog);
    }

    cancelButton.addEventListener('click', function (event) {
        dialog.close();
    });

    showButton.addEventListener('click', function (event) {
        $('.quit-dialog-text').text('Are You Sure?');
        dialog.showModal();
    });

    applyButton.addEventListener('click', function (event) {

        sendRecord(roundID, false, Number(document.getElementById("steps").innerHTML), document.getElementById('timer').innerHTML);

        $.ajax({
            url: requrl + 'round' + '/quitRound/' + roundID,
            type: 'get',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (data) {
                dialog.close();
                window.location = '/home';
                console.log(data);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                $('.quit-dialog-text').text('Connection error, please try again.');
                console.log('error ' + textStatus + " " + errorThrown);
            }
        });
    });
}());


/**
 * Game Finish
 */

var gameFinishDialog = document.querySelector('#game_finish_dialog');
(function () {
    var rankButton = document.querySelector('#rank-button');
    var returnButton = document.querySelector('#return-button');

    if (!gameFinishDialog.showModal) {
        dialogPolyfill.registerDialog(gameFinishDialog);
    }
    rankButton.addEventListener('click', function (event) {
        gameFinishDialog.close();

        var steps = Number(document.getElementById("steps").innerHTML);
        var full_time = document.getElementById('timer').innerHTML;
        sendRecord(roundID, true, steps, full_time);       
        
        $.ajax({
            url: requrl + 'round' + '/quitRound/' + roundID,
            type: 'get',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (data) {
                window.location = '/roundrank/' + roundID;
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log('error ' + textStatus + " " + errorThrown);
            }
        });
    });

    returnButton.addEventListener('click', function (event) {
        gameFinishDialog.close();

        var steps = Number(document.getElementById("steps").innerHTML);
        var full_time = document.getElementById('timer').innerHTML;
        sendRecord(roundID, true, steps, full_time);    

        $.ajax({
            url: requrl + 'round' + '/quitRound/' + roundID,
            type: 'get',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (data) {
                window.location = '/home';
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log('error ' + textStatus + " " + errorThrown);
            }
        });
    });
}());

document.querySelector('#show_steps').addEventListener('click', function () {
    $('#steps').fadeToggle('slow');
});
document.querySelector('#show_timer').addEventListener('click', function () {
    $('#timer').fadeToggle('slow');
});

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
function timedCount() {
    var hours = Math.floor(time / 3600);
    var minutes = Math.floor((time - hours * 3600) / 60);
    var seconds = time - hours * 3600 - minutes * 60;
    if (hours >= 0 && hours <= 9) hours = '0' + hours;
    if (minutes >= 0 && minutes <= 9) minutes = '0' + minutes;
    if (seconds >= 0 && seconds <= 9) seconds = '0' + seconds;
    document.getElementById('timer').innerHTML = hours + ":" + minutes + ":" + seconds;
    time = time + 1;
    t = setTimeout(timedCount, 1000);
}

if (puzzle)
    timedCount();

$('#myselect').change(function () {
    if (puzzle) {
        if (this.value == "DragTileFirst") {
            puzzle.dragMode = "tile-First";
        }
        else {
            puzzle.dragMode = "group-First";
        }
    }
});


var path;
var movePath = false;

$('.puzzle-image').css('margin', '-' + imgHeight / 2 + 'px 0 0 -' + imgWidth / 2 + 'px');

var downTime, alreadyDragged, dragTime, draggingGroup;
var mousedowned = false;
var timeoutFunction;
function onMouseDown(event) {
    mousedowned = true;
    var tilesCount = puzzle.pickTile(event.point);
    if (tilesCount > 0) {
        timeoutFunction = setTimeout(puzzle.dragTileOrTiles, 500);
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
    puzzle.releaseTile();
    mousedowned = false;
}


function onMouseDrag(event) {
    mousedowned = true;
    if (timeoutFunction) {
        clearTimeout(timeoutFunction);
    }
    puzzle.dragTile(event.delta);
}

function onKeyUp(event) {
    switch (event.key) {
        case 'z':
            puzzle.zoom(.1);
            break;
        case 'x':
            puzzle.zoom(-.1);
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
    }
    return raster;
}

function JigsawPuzzle(config) {

    socket.on('someoneSolved', function (data) {
        if (data.round_id == roundID) {
            $('#msgModal').modal({
                keyboard: true
            });
            document.getElementById("round_id").innerHTML = 'Round ' + data.round_id;
            document.getElementById("winner").innerHTML = 'WINNER : ' + data.player_name;
            document.getElementById("info").innerHTML = 'Time: ' + data.time + '   Steps: ' + data.steps;
        }
    });

    var instance = this; // the current object(which calls the function)
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
    this.tilesPerColumn = tilesPerColumn,
        this.puzzleImage = this.originImage.getSubRaster(new Rectangle(0, 0, this.tilesPerRow * this.tileWidth, this.tilesPerColumn * this.tileWidth));
    this.puzzleImage.size *= Math.max((this.tileWidth / 2) / this.puzzleImage.size.width,
        (this.tileWidth / 2) / this.puzzleImage.size.height) + 1
    this.puzzleImage.position = view.center;

    this.originImage.visible = false;
    this.puzzleImage.visible = false;

    this.dragMode = config.dragMode;

    this.showHints = config.showHints;

    this.tileNum = this.tilesPerRow * this.tilesPerColumn;

    if (this.tileShape == "voronoi") {
        this.tileMarginWidth = this.tileWidth * 0.5;
    }
    else {
        this.tileMarginWidth = this.tileWidth * ((100 / this.tileWidth - 1) / 2);
    }
    this.selectedTile = undefined;
    this.selectedGroup = undefined;

    this.saveShapeArray = shapeArray;
    this.saveTilePositions = undefined;
    this.shapeArray = undefined;
    this.tiles = undefined;

    this.hintsShowing = false;
    this.draging = false;

    this.shadowScale = 1.5;

    this.steps = 0;
    this.allowOverlap = config.allowOverlap;

    this.gameFinished = false;

    this.edgeColor = ['red', '#900090', '#009090', 'black'];
    this.colorBorderWidth = 7;


    console.log('Round ' + roundID + ' starts : ' + this.tileNum + ' tiles(' + this.tilesPerRow + ' * ' + this.tilesPerColumn + ')');

    loadGame();

    function createAndPlaceTiles(needIntro) {
        if (instance.tileShape == "voronoi") {
            instance.tiles = createVoronoiTiles(instance.tilesPerRow, instance.tilesPerColumn);
        }
        else {
            instance.tiles = createTiles(instance.tilesPerRow, instance.tilesPerColumn);
        }
        randomPlaceTiles(instance.tilesPerRow, instance.tilesPerColumn);

        for (var i = 0; i < instance.tiles.length; i++) {
            var tile = instance.tiles[i];
            refreshAroundTiles(tile);
            tile.aroundTilesChanged = false;
        }

        if (!instance.saveTilePositions) {
            saveGame();
        }
        else {
            if (!instance.gameFinished) {
                var errors = checkTiles();
                if (errors == 0) {
                    finishGame();
                }
            }
        }

        if (needIntro) {
            $('.mdl-layout__drawer-button').click();
            introJs().setOption("overlayOpacity", 0).setOptions({
                steps: [
                    {
                        element: '#step1',
                        intro: "See current rank!"
                    },
                    {
                        element: '#step2',
                        intro: "Zoom in!"
                    },
                    {
                        element: '#step3',
                        intro: "Zoom out!"
                    },
                    {
                        element: '#step4',
                        intro: "Restart the game!"
                    },
                    {
                        element: '#ensure_quit',
                        intro: "Quit the game!"
                    },
                    {
                        element: '#step6',
                        intro: "Return to the center!"
                    },
                    {
                        element: '#myselect',
                        intro: "Change the drag mode here!"
                    },
                    {
                        element: '#steps_chip',
                        intro: "Show/Hide the step counter!"
                    },
                    {
                        element: '#timer_chip',
                        intro: "Show/Hide the time counter!"
                    },
                    {
                        intro: "Drag mode 'dragTileFirst': short press to drag a tile and long press to drag a group of tiles, vice versa."
                    },
                    {
                        intro: "Now Let's Begin!"
                    }
                ],
                scrollToElement: false
            }).start();
        }
    }

    function refreshAroundTiles(tile, beHinted, needToSendLinks) {
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
            if (tile.aroundTiles[i] != aroundTiles[i]) {
                aroundTilesChanged = true;
                if(beHinted){
                    tile.hintedTiles[i] = true;
                }
                else{
                    tile.hintedTiles[i] = false;
                }
            }
        }

        if(needToSendLinks && aroundTilesChanged){
            checkLinks(roundID, getTileIndex(tile), tile.aroundTiles, aroundTiles);
        }

        tile.aroundTiles = aroundTiles;
        tile.aroundTilesChanged = aroundTilesChanged;
    }

    function calcHintedTile(){
        var hintedTileNum = {
            totalTile: 0,
            normalTile: 0,
            hintedTile: 0
        };
        for(var i = 0; i < instance.tiles.length; i++){
            var tile = instance.tiles[i];
            for(var j = 0; j < tile.hintedTiles.length; j++){
                if(tile.hintedTiles[j]){
                    hintedTileNum.hintedTile += 1;
                }
                else{
                    hintedTileNum.normalTile += 1;
                }
                hintedTileNum.totalTile += 1;
            }
        }
        return hintedTileNum;
    }

    function finishGame() {
        instance.gameFinished = true;

        clearTimeout(t);
        gameFinishDialog.showModal();
        
        var hintedTileNum = calcHintedTile();
        console.log(hintedTileNum)
        /**          
         * Once one person solves the puzzle, the round is over          
         * Send a msg to the server and the server broadcast it to all players          
         **/
        steps = Number(document.getElementById("steps").innerHTML);
        full_time = document.getElementById('timer').innerHTML;
        socket.emit('iSolved', { round_id: roundID, player_name: player_name, steps: steps, time: full_time });
        // once game starts, don't pull players
        // $.ajax({
        //     url: requrl + 'round' + '/quitRound/' + roundID,
        //     type: 'get',
        //     dataType: 'json',
        //     cache: false,
        //     timeout: 5000,
        //     success: function (data) {
        //         gameFinishDialog.showModal();
        //         console.log(data);
        //     },
        //     error: function (jqXHR, textStatus, errorThrown) {
        //         finishGame();
        //         console.log('error ' + textStatus + " " + errorThrown);
        //     }
        // });
    }

    function randomPlaceTiles(xTileCount, yTileCount) {
        var tiles = instance.tiles;
        var tileIndexes = instance.tileIndexes;
        if (instance.saveTilePositions) {
            for (var i = 0; i < instance.saveTilePositions.length; i++) {
                var tilePos = instance.saveTilePositions[i];
                var tile = instance.tiles[tilePos.index];
                placeTile(tile, new Point(tilePos.x, tilePos.y));
                tile.moved = false; // if one tile just clicked or actually moved(if moved, opacity=1)
                tile.aroundTilesChanged = false;
                tile.noAroundTiles = true;
                tile.aroundTiles = new Array(-1, -1, -1, -1);
                tile.hintedTiles = new Array(false, false, false, false);
                tile.conflictTiles = new Array();
                tile.positionMoved = false;
            }
            return;
        }
        // randomly select tiles and place them one by one 
        for (var y = 0; y < yTileCount; y++) {
            for (var x = 0; x < xTileCount; x++) {

                var index1 = Math.floor(Math.random() * tileIndexes.length);
                var index2 = tileIndexes[index1];
                var tile = tiles[index2];
                tileIndexes.remove(index1, 1);

                var position = view.center -
                    new Point(instance.tileWidth, instance.tileWidth / 2) +
                    new Point(instance.tileWidth * (x * 2 + ((y % 2))), instance.tileWidth * y) -
                    new Point(instance.puzzleImage.size.width, instance.puzzleImage.size.height / 2);

                var cellPosition = new Point(
                    Math.round(position.x / instance.tileWidth),//returns int closest to arg
                    Math.round(position.y / instance.tileWidth));

                tile.position = cellPosition * instance.tileWidth; // round position(actual (x,y) in the canvas)
                tile.cellPosition = cellPosition; // cell position(in which grid the tile is)
                tile.relativePosition = new Point(0, 0);
                tile.moved = false; // if one tile just clicked or actually moved(if moved, opacity=1)
                tile.aroundTilesChanged = false;
                tile.noAroundTiles = true;
                tile.aroundTiles = new Array(-1, -1, -1, -1);
                tile.hintedTiles = new Array(false, false, false, false);
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
                border.strokeWidth = (hasBorder == "true") ? 5 : 0;

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
                //console.log(tile.findex);
                tiles.push(tile);
                tile.name = "tile-" + tileIndexes.length;
                tileIndexes.push(tileIndexes.length);
            }
        }
        instance.tileIndexes = tileIndexes;
        return tiles;
    }

    function showHintColor(tileIndex, hintTilesIndexs, direction) {
        showColorBorder(tileIndex, direction, direction, true);
        for (var i = 0; i < hintTilesIndexs.length; i++) {
            var reverseDirection = 4;
            if (direction % 2 == 0) {
                reverseDirection = 2 - direction;
            }
            else {
                reverseDirection = 4 - direction;
            }
            showColorBorder(hintTilesIndexs[i], reverseDirection, direction, true);
        }
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
                //console.log(tile.findex);
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

    this.pickTile = function (point) {
        if (instance.hintsShowing) {
            return;
        }
        findSelectTile(point);
        if (instance.selectedTile) {
            if (!instance.selectedTile[0].picking) {
                for (var i = 0; i < instance.selectedTile.length; i++) {
                    instance.selectedTile[i].picking = true;
                }
            }
            else {
                instance.releaseTile();
                return;
            }

            instance.draging = true;

            var pos = new Point(instance.selectedTile[0].position.x, instance.selectedTile[0].position.y);
            for (var i = 0; i < instance.selectedTile.length; i++) {
                var tile = instance.selectedTile[i];
                tile.opacity = .5;
                tile.position = pos + tile.relativePosition * instance.tileWidth;
                tile.originPosition = tile.cellPosition;
            }
            return instance.selectedTile.length;
        }
        return 0;
    }

    function checkConflict(tiles, centerCellPosition) {
        if (Math.abs(centerCellPosition.x) > 70 || Math.abs(centerCellPosition.y) > 50) {
            return true;
        }
        var hasConflict = false;
        if (this.allowOverlap)
            return hasConflict;
        for (var i = 0; i < tiles.length; i++) {
            var tile = tiles[i];

            var cellPosition = centerCellPosition + tile.relativePosition;
            var roundPosition = cellPosition * instance.tileWidth;

            var alreadyPlacedTile = (getTileAtCellPosition(cellPosition) != undefined);
            hasConflict = hasConflict || alreadyPlacedTile;
            if (instance.tileShape != "voronoi") {
                var topTile = getTileAtCellPosition(cellPosition + new Point(0, -1));
                var rightTile = getTileAtCellPosition(cellPosition + new Point(1, 0));
                var bottomTile = getTileAtCellPosition(cellPosition + new Point(0, 1));
                var leftTile = getTileAtCellPosition(cellPosition + new Point(-1, 0));

                var topTileConflict = (topTile != undefined) && !(topTile.shape.bottomTab + tile.shape.topTab == 0);
                var bottomTileConflict = (bottomTile != undefined) && !(bottomTile.shape.topTab + tile.shape.bottomTab == 0);
                var rightTileConflict = (rightTile != undefined) && !(rightTile.shape.leftTab + tile.shape.rightTab == 0);
                var leftTileConflict = (leftTile != undefined) && !(leftTile.shape.rightTab + tile.shape.leftTab == 0);
                hasConflict = hasConflict || topTileConflict || bottomTileConflict || rightTileConflict || leftTileConflict;
            }
        }
        return hasConflict;
    }

    function placeTile(tile, cellPosition) {
        var roundPosition = cellPosition * instance.tileWidth;
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

    function sendLinks(tile) {
        var tileIndex = getTileIndex(tile);
        if (tileIndex < 0)
            return;

        var cellPosition = tile.cellPosition;

        var topTile = getTileAtCellPosition(cellPosition + new Point(0, -1));
        var rightTile = getTileAtCellPosition(cellPosition + new Point(1, 0));
        var bottomTile = getTileAtCellPosition(cellPosition + new Point(0, 1));
        var leftTile = getTileAtCellPosition(cellPosition + new Point(-1, 0));

        // index 0 1 2 3 = T R B L
        var aroundTiles = new Array(getTileIndex(topTile), getTileIndex(rightTile),
            getTileIndex(bottomTile), getTileIndex(leftTile));

        var aroundTilesChanged = false;

        if (tile.aroundTiles) {
            for (var i = 0; i < aroundTiles.length; i++) {
                if (tile.aroundTiles[i] != aroundTiles[i]) {
                    aroundTilesChanged = true;

                    tile.hintedTiles[i] = false;

                    if (aroundTiles[i] == -1) { // add conflict record to both tile connected before
                        tile.conflictTiles.push(tile.aroundTiles[i]);
                        var neighborTile = instance.tiles[tile.aroundTiles[i]];
                        neighborTile.conflictTiles.push(tileIndex);
                    }

                    if (tile.aroundTiles[i] == -1) { // remove conflict record to both tile
                        var tmpConflictTiles = new Array();
                        for (var j = 0; j < tile.conflictTiles.length; j++) {
                            if (tile.conflictTiles[j] != aroundTiles[i]) {
                                tmpConflictTiles.push(tile.conflictTiles[j]);
                            }
                        }
                        tile.conflictTiles = tmpConflictTiles;

                        var neighborTile = instance.tiles[aroundTiles[i]];
                        tmpConflictTiles = new Array();
                        for (var j = 0; j < neighborTile.conflictTiles.length; j++) {
                            if (neighborTile.conflictTiles[j] != tileIndex) {
                                tmpConflictTiles.push(neighborTile.conflictTiles[j]);
                            }
                        }
                        neighborTile.conflictTiles = tmpConflictTiles;
                    }
                }
                if (aroundTiles[i] >= 0) {
                    var neighborTile = instance.tiles[aroundTiles[i]];
                    refreshAroundTiles(neighborTile);
                }
                if (tile.aroundTiles[i] >= 0) {
                    var neighborTile = instance.tiles[tile.aroundTiles[i]];
                    refreshAroundTiles(neighborTile);
                }
            }
        }
        else {
            aroundTilesChanged = true;
        }

        if (aroundTilesChanged) {
            // selected, before, after
            console.log('Before:' + tile.aroundTiles);
            console.log('After:' + aroundTiles);
            if (!tile.aroundTiles) {
                tile.aroundTiles = new Array(-1, -1, -1, -1);
            }
            checkLinks(roundID, tileIndex, tile.aroundTiles, aroundTiles);
        }

        var sum = 0;
        for (var i = 0; i < aroundTiles.length; i++) {
            sum += aroundTiles[i];
        }
        if (sum == -4) {
            tile.noAroundTiles = true;
        }
        else {
            tile.noAroundTiles = false;
        }

        tile.aroundTiles = aroundTiles;
        tile.aroundTilesChanged = aroundTilesChanged;
    }

    this.releaseTile = function () {
        if (instance.draging) {

            var centerCellPosition = new Point(
                Math.round(instance.selectedTile[0].position.x / instance.tileWidth),
                Math.round(instance.selectedTile[0].position.y / instance.tileWidth));

            var originCenterCellPostion = instance.selectedTile[0].originPosition;

            // console.log("releaseTile cellPosition : x : " + centerCellPosition.x + " y : " + centerCellPosition.y);
            var hasConflict = checkConflict(instance.selectedTile, centerCellPosition);
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

                if (tile.differentColor.length > 0) {
                    var tileIndex = getTileIndex(tile);
                    for (var j = 0; j < tile.differentColor.length; j++) {
                        showColorBorder(tileIndex, tile.differentColor[j], tile.colorDirection[j], false);
                    }
                }
            }

            for (var i = 0; i < instance.selectedTile.length; i++) {
                sendLinks(tile);
            }

            if (tilesMoved && !instance.gameFinished) {
                instance.steps = instance.steps + 1;
                saveGame();
            }

            if (!hasConflict && instance.showHints) {
                for (var i = 0; i < instance.selectedTile.length == 1; i++) {
                    var tile = instance.selectedTile[i];
                    if (!tile.noAroundTiles && tile.aroundTilesChanged) {
                        getHints(roundID, getTileIndex(tile));
                    }
                }
            }

            for (var i = 0; i < instance.selectedTile.length; i++) {
                instance.selectedTile[i].opacity = 1;
            }

            instance.selectedTile = null;
            instance.draging = false;

            document.getElementById("steps").innerHTML = instance.steps;

            if (!instance.gameFinished) {
                var errors = checkTiles();
                if (errors == 0) {
                    finishGame();
                }
            }

            normalizeTiles();
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
        }
    }

    function hideColorBorder(index) {
        var tile = instance.tiles[index];
        if (tile.differentColor.length > 0) {
            tile.topEdge.visible = false;
            tile.rightEdge.visible = false;
            tile.bottomEdge.visible = false;
            tile.leftEdge.visible = false;
            tile.colorBorder.visible = false;
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

    function showColorBorder(index, direction, colorDirection, pushToArray) {
        var tile = instance.tiles[index];
        switch (direction) {
            case 0:
                tile.topEdge.visible = true;
                setGradientStrockColor(tile.topEdge, instance.edgeColor[colorDirection]);
                break;
            case 1:
                tile.rightEdge.visible = true;
                setGradientStrockColor(tile.rightEdge, instance.edgeColor[colorDirection]);
                break;
            case 2:
                tile.bottomEdge.visible = true;
                setGradientStrockColor(tile.bottomEdge, instance.edgeColor[colorDirection]);
                break;
            case 3:
                tile.leftEdge.visible = true;
                setGradientStrockColor(tile.leftEdge, instance.edgeColor[colorDirection]);
                break;
            default:
                tile.colorBorder.visible = true;
                setGradientStrockColor(tile.colorBorder, instance.edgeColor[colorDirection]);
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
                tile.colorDirection.push(colorDirection);
            }

        }
    }

    function normalizeTiles() {
        for (var i = 0; i < instance.tiles.length; i++) {
            var tile = instance.tiles[i];
            var position = tile.position;

            var cellPosition = new Point(
                Math.round(position.x / instance.tileWidth),//returns int closest to arg
                Math.round(position.y / instance.tileWidth));

            tile.position = cellPosition * instance.tileWidth; // round position(actual (x,y) in the canvas)
            tile.cellPosition = cellPosition; // cell position(in which grid the tile is)

            tile.relativePosition = new Point(0, 0);
            tile.moved = false; // if one tile just clicked or actually moved(if moved, opacity=1)
            tile.aroundTilesChanged = false;
            tile.positionMoved = false;
        }
    }

    function getHints(round_id, selectedTileIndex) {
        // var hintTileIndexes=new Array(-1,-1,-1,-1);
        $.ajax({
            url: requrl + 'graph/getHints/' + round_id + '/' + selectedTileIndex,
            type: 'get',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (data) {
                // var data = $.parseJSON(data);
                // indexes = directions(0 1 2 3=T R B L)
                console.log('getHints: ' + JSON.stringify(data));
                if (!mousedowned) {
                    instance.hintsShowing = true;
                    if (data.sure) {
                        var sureHintTiles = JSON.parse(data.sure);
                        var unsureHintTiles = JSON.parse(data.unsure);
                        for (var d = 0; d < 4; d++) {
                            var unsureHintTile = unsureHintTiles[d];
                            if (unsureHintTile.length > 0) {
                                showHintColor(selectedTileIndex, unsureHintTile, d);
                            }
                        }
                        showHints(selectedTileIndex, sureHintTiles);
                    }
                    else {
                        showHints(selectedTileIndex, data);
                    }
                    normalizeTiles();
                    instance.hintsShowing = false;
                }
                return data;
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log('getHints: ' + 'error ' + textStatus + " " + errorThrown);
            }
        });
    }

    function showHints(selectedTileIndex, hintTiles) {
        var tile = instance.tiles[selectedTileIndex];

        var cellPosition = tile.cellPosition;

        console.log('hintTiles: ' + JSON.stringify(hintTiles));

        if (!hintTiles) {
            return;
        }

        var hintTilesCount = 0;
        for (var j = 0; j < hintTiles.length; j++) {
            var correctTileIndex = hintTiles[j];
            if (correctTileIndex < 0) {
                continue;
            }

            if (tile.aroundTiles && tile.aroundTiles[j] > 0) {
                continue;
            }

            var isConflictTile = false;
            for (var i = 0; i < tile.conflictTiles.length; i++) {
                if (tile.conflictTiles[i] == correctTileIndex) {
                    isConflictTile = true;
                    break;
                }
            }
            if (isConflictTile) {
                continue;
            }
            console.log(correctTileIndex);
            var correctTile = instance.tiles[correctTileIndex];

            if (correctTile.picking) {
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
                continue;
            }

            for (var i = 0; i < groupTiles.length; i++) {
                groupTiles[i].picking = true;
            }
            var hasConflict = checkConflict(groupTiles, correctCellposition);
            if (!hasConflict) {
                for (var i = 0; i < groupTiles.length; i++) {
                    var hintTile = groupTiles[i];
                    placeTile(hintTile, correctCellposition + hintTile.relativePosition);
                    hintTile.relativePosition = new Point(0, 0);
                    hintTile.picking = false;
                    hintTile.alreadyHinted = true;
                }
                hintTilesCount += groupTiles.length;
            }
            for (var i = 0; i < groupTiles.length; i++) {
                groupTiles[i].picking = false;
                refreshAroundTiles(groupTiles[i], true, true);
                if (groupTiles[i].aroundTilesChanged) {
                    for (var t = 0; t < groupTiles[i].aroundTiles.length; t++) {
                        var neighborIndex = groupTiles[i].aroundTiles[t];
                        if (neighborIndex >= 0) {
                            var neighborTile = instance.tiles[neighborIndex];
                            refreshAroundTiles(neighborTile, true);
                        }
                    }
                }

            }
        }
        if (hintTilesCount) {
            tile.alreadyHinted = true;
        }

        // judge the hint tiles
        if (!instance.gameFinished) {
            var errors = checkTiles();
            if (errors == 0) {
                finishGame();
            }
        }
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

    this.animation = function () {
        var changeOpacity = function (path) {
            var speed = 0.005;
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

        for (var i = 0; i < instance.tiles.length; i++) {
            var tile = instance.tiles[i];
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
    }

    this.dragTile = function (delta) {
        if (instance.draging) {
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
        }
        else {
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
        array.push(tile);
        for (var i = 0; i < 4; i++) {
            var newPos = tile.cellPosition + directions[i];
            newTile = getTileAtCellPosition(newPos);
            if (newTile) {
                DFSTiles(newTile, array, relativePosition + directions[i]);
            }
        }
    }

    function findSelectTile(point) {
        var cellPosition = new Point(
            Math.round(point.x / instance.tileWidth),//returns int closest to arg
            Math.round(point.y / instance.tileWidth));
        var hitResult = project.hitTest(point);
        if (!hitResult || hitResult.type != "pixel") {
            instance.selectedTile = null;
            return;
        }
        var img = hitResult.item;
        var tile = img.parent.parent;
        // console.log(tile.name);
        if (tile.picking) {
            instance.selectedTile = null;
            return;
        }
        if (tile && tile.name) {
            instance.selectedTile = new Array();
            if (instance.dragMode == "tile-First") {
                instance.selectedTile.push(tile);
            }
            else {
                DFSTiles(tile, instance.selectedTile, new Point(0, 0));
            }
        }
        else {
            instance.selectedTile = null;
        }
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
                instance.selectedTile[i].opacity = 1;
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
                instance.selectedTile[i].opacity = .5;
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

    function saveGame() {
        var tilePositions = new Array();
        for (var i = 0; i < instance.tiles.length; i++) {
            var tile = instance.tiles[i];
            var tilePos = {
                index: i,
                x: tile.cellPosition.x,
                y: tile.cellPosition.y,
            };
            tilePositions.push(tilePos);
        }
        var params = {
            round_id: roundID,
            steps: instance.steps,
            time: time,
            tiles: JSON.stringify(tilePositions),
        };
        $.ajax({
            url: requrl + 'round/saveGame',
            data: params,
            type: 'post',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (data) {
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log('saveGame: ' + 'error ' + textStatus + " " + errorThrown);
            }
        });
    }

    function loadGame() {
        $.ajax({
            url: requrl + 'round/loadGame',
            type: 'get',
            dataType: 'json',
            cache: false,
            timeout: 5000,
            success: function (data) {
                var needIntro = !data.round_id;
                if (data.round_id == roundID) {
                    console.log('loadGame: ' + 'success');
                    time = data.time;
                    instance.steps = data.steps;
                    document.getElementById("steps").innerHTML = instance.steps;
                    instance.saveTilePositions = JSON.parse(data.tiles);
                }
                createAndPlaceTiles(needIntro)
            },
            error: function (jqXHR, textStatus, errorThrown) {
                console.log('loadGame: ' + 'error ' + textStatus + " " + errorThrown);
            }
        });
    }
}

$(window).resize();
function resizeCanvas() {
    var canvas = document.getElementById('canvas');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight
}
$('#canvas').resize();
resizeCanvas();