/*
* Drawer functions
*/
$('.zoomIn').click(function () {
    puzzle.zoom(.1);
});

$('.zoomOut').click(function () {
    puzzle.zoom(-.1);
});

$('.help').mousedown(function () {
    puzzle.showLastResult();
});

$('.restart').click(function () {
    // document.execCommand('Refresh');
    window.location.reload();
    // var puzzle = new JigsawPuzzle(config);
});

$('.returnCenter').click(function () {
    view.scrollBy(new Point(560, 360) - view.center);
});

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
        dialog.showModal();
    });

    applyButton.addEventListener('click', function (event) {
        dialog.close();
        window.location = '/home';
    });
}());


/**
 * Game Finish
 */

var gameFinishDialog = document.querySelector('#game_finish_dialog');
(function () {
    var stayButton = document.querySelector('#stay-button');
    var returnButton = document.querySelector('#return-button');

    if (!gameFinishDialog.showModal) {
        dialogPolyfill.registerDialog(gameFinishDialog);
    }
    stayButton.addEventListener('click', function (event) {
        gameFinishDialog.close();
    });

    returnButton.addEventListener('click', function (event) {
        gameFinishDialog.close();
        window.location = '/home';
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

var level = getUrlParams('level');

$('#puzzle-image').attr('src', 'images/minions.jpg');

var imgWidth = $('.puzzle-image').css('width').replace('px', '');
var imgHeight = $('.puzzle-image').css('height').replace('px', '');
var tileWidth = 64;

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
    tilesPerRow: Math.floor(imgWidth / tileWidth), //returns min int >= arg
    tilesPerColumn: Math.floor(imgHeight / tileWidth),
    imgWidth: imgWidth,
    imgHeight: imgHeight,
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
function getUrlParams(key) {
    var reg = new RegExp("(^|&)" + key + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]); return null;
}


if (level == 1) {
    config.tileShape = 'curved';
    config.level = 1;
    //config others here
} else if (level == 2) {
    config.tileShape = 'straight';
    config.level = 2;
    //config others here    
} else if (level == 3) {
    config.tileShape = 'voronoi';
    config.level = 3;
} else if (level == 4) {
    config.tileShape = 'voronoi';
    config.level = 4;
    config.imgName = 'grey';
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
var timeoutFunction;
function onMouseDown(event) {
    var tilesCount = puzzle.pickTile(event.point);
    if(tilesCount > 0){
        timeoutFunction = setTimeout(puzzle.dragTileOrTiles, 500);
    }
}

function onMouseUp(event) {
    if (timeoutFunction) {
        clearTimeout(timeoutFunction);
    }
    puzzle.releaseTile();
}


function onMouseDrag(event) {
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
    // API test
    // getHints();
    // var params = {
    //     from: 4,
    //     to: 8,
    //     dir: 3
    // };

    // getHints(4);
    // checkLinks(4, [1,3,-1,0]);

    var instance = this; // the current object(which calls the function)
    this.tileShape = config.tileShape;
    this.level = config.level;

    this.currentZoom = 1;
    this.zoomScaleOnDrag = config.zoomScaleOnDrag;
    this.imgName = config.imgName;
    this.shadowWidth = config.shadowWidth;
    this.tileWidth = config.tileWidth;
    this.tilesPerRow = config.tilesPerRow;
    this.tilesPerColumn = config.tilesPerColumn;
    this.originImage = getOriginImage(config);
    this.puzzleImage = this.originImage.getSubRaster(new Rectangle(0, 0,
        this.tileWidth * this.tilesPerRow, this.tileWidth * this.tilesPerColumn));
    this.puzzleImage.position = view.center;

    this.originImage.visible = false;
    this.puzzleImage.visible = false;

    this.dragMode = config.dragMode;

    this.showHints = config.showHints;

    this.tileNum = this.tilesPerRow * this.tilesPerColumn;
    // output some info about this puzzle
    console.log('Level ' + level + ' started : ' + this.tileNum + ' tiles(' + this.tilesPerRow + ' rows * ' + this.tilesPerColumn + ' cols)');

    if (this.tileShape == "voronoi") {
        this.tileMarginWidth = this.tileWidth * 0.5;
    }
    else {
        this.tileMarginWidth = this.tileWidth * 0.203125;
    }
    this.selectedTile = undefined;
    this.selectedGroup = undefined;

    this.shadowScale = 1.5;
    if (this.tileShape == "voronoi") {
        this.tiles = createVoronoiTiles(this.tilesPerRow, this.tilesPerColumn);
    }
    else {
        this.tiles = createTiles(this.tilesPerRow, this.tilesPerColumn);
    }
    randomPlaceTiles(this.tilesPerRow, this.tilesPerColumn);
    // keep track of the steps of the current user
    this.steps = 0;
    this.allowOverlap = config.allowOverlap;

    this.gameFinished = false;

    function randomPlaceTiles(xTileCount, yTileCount) {
        var tiles = instance.tiles;
        var tileIndexes = instance.tileIndexes;
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
                    Math.round(position.x / instance.tileWidth) + 1,//returns int closest to arg
                    Math.round(position.y / instance.tileWidth) + 1);

                tile.position = cellPosition * instance.tileWidth; // round position(actual (x,y) in the canvas)
                tile.cellPosition = cellPosition; // cell position(in which grid the tile is)
                tile.relativePosition = new Point(0, 0);
                tile.moved = false; // if one tile just clicked or actually moved(if moved, opacity=1)
                tile.groupID = -1; // to which group the tile belongs(-1 by default
                tile.grouped = false;
                tile.aroundTilesChanged = false;
                tile.noAroundTiles = true;
                tile.aroundTiles = new Array(-1, -1, -1, -1);
                tile.positionMoved = false;
            }
        }
    }

    function createTiles(xTileCount, yTileCount) {
        var tiles = new Array();
        var tileRatio = instance.tileWidth / 100.0;

        var shapeArray = getRandomShapes(xTileCount, yTileCount);
        var tileIndexes = new Array();
        for (var y = 0; y < yTileCount; y++) {
            for (var x = 0; x < xTileCount; x++) {

                var shape = shapeArray[y * xTileCount + x];

                var mask = getMask(tileRatio, shape.topTab, shape.rightTab, shape.bottomTab, shape.leftTab, instance.tileWidth);
                mask.opacity = 0.01;
                mask.strokeColor = '#fff'; //white
                var cloneImg = instance.puzzleImage.clone();
                var img = getTileRaster(
                    cloneImg,
                    new Size(instance.tileWidth, instance.tileWidth),
                    new Point(instance.tileWidth * x, instance.tileWidth * y)
                );
                //var border = mask.clone();
                //border.strokeColor = 'red'; //grey
                //border.strokeWidth = 0;

                // each tile is a group of
                var tile = new Group(mask, img);
                tile.picking = false;
                tile.alreadyHinted = false;
                tile.clipped = true;
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

    function getRandomShapes(width, height) {
        var shapeArray = new Array();

        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) {

                var topTab = undefined;
                var rightTab = undefined;
                var bottomTab = undefined;
                var leftTab = undefined;

                if (y == 0)
                    topTab = 0;

                if (y == height - 1)
                    bottomTab = 0;

                if (x == 0)
                    leftTab = 0;

                if (x == width - 1)
                    rightTab = 0;

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

        //Top
        for (var i = 0; i < curvyCoords.length / 6; i++) {
            var p1 = topLeftEdge + new Point(curvyCoords[i * 6 + 0] * tileRatio, topTab * curvyCoords[i * 6 + 1] * tileRatio);
            var p2 = topLeftEdge + new Point(curvyCoords[i * 6 + 2] * tileRatio, topTab * curvyCoords[i * 6 + 3] * tileRatio);
            var p3 = topLeftEdge + new Point(curvyCoords[i * 6 + 4] * tileRatio, topTab * curvyCoords[i * 6 + 5] * tileRatio);

            mask.cubicCurveTo(p1, p2, p3);
        }
        //Right
        var topRightEdge = topLeftEdge + new Point(tileWidth, 0);
        for (var i = 0; i < curvyCoords.length / 6; i++) {
            var p1 = topRightEdge + new Point(-rightTab * curvyCoords[i * 6 + 1] * tileRatio, curvyCoords[i * 6 + 0] * tileRatio);
            var p2 = topRightEdge + new Point(-rightTab * curvyCoords[i * 6 + 3] * tileRatio, curvyCoords[i * 6 + 2] * tileRatio);
            var p3 = topRightEdge + new Point(-rightTab * curvyCoords[i * 6 + 5] * tileRatio, curvyCoords[i * 6 + 4] * tileRatio);

            mask.cubicCurveTo(p1, p2, p3);
        }
        //Bottom
        var bottomRightEdge = topRightEdge + new Point(0, tileWidth);
        for (var i = 0; i < curvyCoords.length / 6; i++) {
            var p1 = bottomRightEdge - new Point(curvyCoords[i * 6 + 0] * tileRatio, bottomTab * curvyCoords[i * 6 + 1] * tileRatio);
            var p2 = bottomRightEdge - new Point(curvyCoords[i * 6 + 2] * tileRatio, bottomTab * curvyCoords[i * 6 + 3] * tileRatio);
            var p3 = bottomRightEdge - new Point(curvyCoords[i * 6 + 4] * tileRatio, bottomTab * curvyCoords[i * 6 + 5] * tileRatio);

            mask.cubicCurveTo(p1, p2, p3);
        }
        //Left
        var bottomLeftEdge = bottomRightEdge - new Point(tileWidth, 0);
        for (var i = 0; i < curvyCoords.length / 6; i++) {
            var p1 = bottomLeftEdge - new Point(-leftTab * curvyCoords[i * 6 + 1] * tileRatio, curvyCoords[i * 6 + 0] * tileRatio);
            var p2 = bottomLeftEdge - new Point(-leftTab * curvyCoords[i * 6 + 3] * tileRatio, curvyCoords[i * 6 + 2] * tileRatio);
            var p3 = bottomLeftEdge - new Point(-leftTab * curvyCoords[i * 6 + 5] * tileRatio, curvyCoords[i * 6 + 4] * tileRatio);

            mask.cubicCurveTo(p1, p2, p3);
        }
        return mask;
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

                var cloneImg = instance.puzzleImage.clone();
                var img = getTileRaster(
                    cloneImg,
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
            instance.selectedTile[0].originPosition = pos;
            for (var i = 0; i < instance.selectedTile.length; i++) {
                var tile = instance.selectedTile[i];
                tile.opacity = .5;
                tile.position = pos + tile.relativePosition * instance.tileWidth;
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
        if (tile.cellPosition == tile.originPosition) {
            tile.positionMoved = false;
        }
        else {
            tile.positionMoved = true;
        }
        tile.cellPosition = cellPosition;
        tile.relativePosition = new Point(0, 0);
    }

    function sendLinks(tile) {
        var tileIndex = getTileIndex(tile);

        if(tileIndex < 0)
            return;

        var cellPosition = tile.cellPosition;

        var topTile = getTileAtCellPosition(cellPosition + new Point(0, -1));
        var rightTile = getTileAtCellPosition(cellPosition + new Point(1, 0));
        var bottomTile = getTileAtCellPosition(cellPosition + new Point(0, 1));
        var leftTile = getTileAtCellPosition(cellPosition + new Point(-1, 0));

        // index 0 1 2 3 = T R B L
        var aroundTiles = new Array(getTileIndex(topTile), getTileIndex(rightTile),
            getTileIndex(bottomTile), getTileIndex(leftTile));

        var aroundTilesChanged = true;
        if (tile.aroundTiles) {
            var i = 0;
            for (; i < aroundTiles.length; i++) {
                if (tile.aroundTiles[i] != aroundTiles[i]) {
                    break;
                }
            }
            if (i == aroundTiles.length) {
                aroundTilesChanged = false;
            }
        }

        if (aroundTilesChanged) {
            checkLinks(tileIndex, aroundTiles);
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

            var originCenterCellPostion = new Point(
                Math.round(instance.selectedTile[0].originPosition.x / instance.tileWidth),
                Math.round(instance.selectedTile[0].originPosition.y / instance.tileWidth));

            // console.log("releaseTile cellPosition : x : " + centerCellPosition.x + " y : " + centerCellPosition.y);

            var hasConflict = checkConflict(instance.selectedTile, centerCellPosition);
            if (instance.selectedTile[0].picking) {
                for (var i = 0; i < instance.selectedTile.length; i++) {
                    instance.selectedTile[i].picking = false;
                }
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
                sendLinks(tile);
            }
            if (tilesMoved && !instance.gameFinished) {
                instance.steps = instance.steps + 1;
            }

            if (!hasConflict && instance.showHints) {
                for (var i = 0; i < instance.selectedTile.length == 1; i++) {
                    var tile = instance.selectedTile[i];
                    if (!tile.noAroundTiles && tile.aroundTilesChanged && !tile.alreadyHinted) {
                        showHints(tile);
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
                    clearTimeout(t);
                    gameFinishDialog.showModal();
                    // sendRecord('Level 1', '2017-10-31 14:00', 245, '16:24');
                    sendRecord(level, getNowFormatDate(), Number(document.getElementById("steps").innerHTML), document.getElementById('timer').innerHTML);
                    instance.gameFinished = true;
                }
            }
        }
    }

    function getCheatHints(tileIndex) {
        var trueHints = getHints(tileIndex);
        if (!trueHints) {
            trueHints = new Array(-1, -1, -1, -1);
        }

        var topTile = undefined;
        var rightTile = undefined;
        var bottomTile = undefined;
        var leftTile = undefined;
        if (tileIndex % instance.tilesPerRow != 0) {
            leftTile = instance.tiles[tileIndex - 1];
        }
        if (tileIndex % instance.tilesPerRow != instance.tilesPerRow - 1) {
            rightTile = instance.tiles[tileIndex + 1];
        }
        if (tileIndex / instance.tilesPerRow != 0) {
            topTile = instance.tiles[tileIndex - instance.tilesPerRow];
        }
        if (tileIndex / instance.tilesPerRow != instance.tilesPerColumn - 1) {
            bottomTile = instance.tiles[tileIndex + instance.tilesPerRow];
        }

        var cheatHints = new Array(getTileIndex(topTile), getTileIndex(rightTile),
            getTileIndex(bottomTile), getTileIndex(leftTile));

        var hintTiles = new Array();

        for (var i = 0; i < cheatHints.length; i++) {
            var steps = instance.steps;
            if (Math.random() < 0.5) {
                hintTiles.push(cheatHints[i]);
            }
            else {
                hintTiles.push(trueHints[i]);
            }
        }

        return hintTiles;
    }

    function showHints(tile) {
        var cellPosition = tile.cellPosition;

        var tileIndex = getTileIndex(tile);

        var hintTiles = getCheatHints(tileIndex);

        if (!hintTiles) {
            return;
        }

        var hintTilesCount = 0;
        for (var j = 0; j < hintTiles.length; j++) {
            var correctTileIndex = hintTiles[j];
            if (correctTileIndex < 0) {
                continue;
            }

            var correctTile = instance.tiles[correctTileIndex];

            if (correctTile.aroundTiles && correctTile.aroundTiles[j] > 0) {
                continue;
            }

            var correctCellposition = cellPosition + directions[j];

            var groupTiles = new Array();

            DFSTiles(correctTile, groupTiles, new Point(0, 0));

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
                    sendLinks(hintTile);
                }
                hintTilesCount += groupTiles.length;
            }
            for (var i = 0; i < groupTiles.length; i++) {
                groupTiles[i].picking = false;
            }
        }
        if (hintTilesCount) {
            tile.alreadyHinted = true;
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
            var tile = img.parent;
            if (!tile.picking) {
                retTile = tile;
            }
        }
        return retTile;
    }

    this.dragTile = function (delta) {
        if (instance.draging) {
            var centerPosition = instance.selectedTile[0].position;
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
        var tile = getTileAtCellPosition(point / instance.tileWidth);
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

}

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
