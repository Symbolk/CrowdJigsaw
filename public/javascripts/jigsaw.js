
// auto hide and show some components when the user switch focus between workspace and sidespace
/*
$('.charms, .title, .info, .progress-bar').mouseleave(function () {
    $('.charms').animate({ opacity: 0 });
    $('.title').animate({ opacity: 0 });
    $('.info').animate({ opacity: 0 });
    $('.progress-bar').animate({ opacity: 0 });
});

$('.charms, .title, .info, .progress-bar').mouseover(function () {
    $('.charms').animate({ opacity: 1.0 });
    $('.title').animate({ opacity: 1.0 });
    $('.info').animate({ opacity: 1.0 });
    $('.progress-bar').animate({ opacity: 1.0 });
});*/

// add functions to the charms(e.g. toolbox)
$('.zoomIn').click(function () {
    puzzle.zoom(.1);
});

$('.zoomOut').click(function () {
    puzzle.zoom(-.1);
});

$('.help').mousedown(function () {
    if ($('.canvas').css('display') == 'none') {
        $('.canvas').show();
        $('.puzzle-image').hide();
        $('.logo').hide();
    } else {
        $('.canvas').hide();
        $('.puzzle-image').show();
        $('.logo').show();
    }
});

var charmsselected = false;

$('.charms').mousedown(function (event) {
    charmsselected = true;
});

$('*').mouseup(function (event) {
    charmsselected = false;
});

$('*').mousemove(function (event) {
    if(charmsselected)
    {
        var x = event.pageX;
        var y = event.pageY;
        console.log("top : " + y + "px", "left : " + x + "px")
        $('.charms').css("position", "absolute"); 
        $('.charms').css("top", y+"px"); 
        $('.charms').css("left", x+"px");
    }
});

$('.restart').click(function () {
    // document.execCommand('Refresh');
    window.location.reload();
    // var puzzle = new JigsawPuzzle(config);
});

var charmsWidth = $('.charms').css('width').replace('px', '');

/**
 * click the settings button and show the puzzle settings
 */
(function () {
    var showButton = document.querySelector('#show-settings');
    var dialog = document.querySelector('#settings');
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

    /**
     * Disabled for now
     */
    applyButton.addEventListener('click', function (event) {
        if (document.querySelector('#option-1').checked === true) {
            // console.log('Level 1');
            // config.tileShape = 'straight';
            // var c = document.querySelector("#canvas");
            // var cxt = c.getContext("2d");
            // cxt.fillStyle = "white";
            // puzzle = new JigsawPuzzle(config);

        } else {
            // console.log('Level 2');
            // config.tileShape = 'curved';
            // $('.canvas').remove();
            // var newC=$('<canvas id="canvas" class="canvas" resize></canvas>');
            // $('.puzzle').append(newC);
            // var puzzle = new JigsawPuzzle(config);
        }
        dialog.close();
    });
}());

Array.prototype.remove = function (start, end) {
    this.splice(start, end);
    return this;
}

view.currentScroll = new Point(0, 0);
var scrollVector = new Point(0, 0);
var scrollMargin = 32;

$('#puzzle-image').attr('src', 'images/cat.jpg');

var imgWidth = $('.puzzle-image').css('width').replace('px', '');
var imgHeight = $('.puzzle-image').css('height').replace('px', '');
var tileWidth = 64;

var config = ({
    zoomScaleOnDrag: 1.25,
    imgName: 'puzzle-image',
    tileShape: 'curved', // curved or straight
    tileWidth: tileWidth,
    tilesPerRow: Math.ceil(imgWidth / tileWidth), //returns min int >= arg
    tilesPerColumn: Math.ceil(imgHeight / tileWidth),
    imgWidth: imgWidth,
    imgHeight: imgHeight,
    shadowWidth: 120,
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
var puzzle = new JigsawPuzzle(config);
puzzle.zoom(-.1);
var path;
var movePath = false;

$('.puzzle-image').css('margin', '-' + imgHeight / 2 + 'px 0 0 -' + imgWidth / 2 + 'px');

var downTime, alreadyDragged, dragTime, draggingGroup;
var timeoutFunction;
function onMouseDown(event) {
    timeoutFunction=window.setTimeout(puzzle.dragOnlyTile,500); 
    puzzle.pickTile();
}

function onMouseUp(event) {
    if(timeoutFunction){
        window.clearTimeout(timeoutFunction); 
    }
    puzzle.releaseTile();
}

function onMouseMove(event) {
    if(timeoutFunction){
        window.clearTimeout(timeoutFunction); 
    }

    puzzle.mouseMove(event.point, event.delta);
}

function onMouseDrag(event) {
    if(timeoutFunction){
        window.clearTimeout(timeoutFunction); 
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


function JigsawPuzzle(config) {
    var instance = this; // the current object(which calls the function)
    this.tileShape = config.tileShape;

    this.currentZoom = 1;
    this.zoomScaleOnDrag = config.zoomScaleOnDrag;
    this.imgName = config.imgName;
    this.shadowWidth = config.shadowWidth;
    this.puzzleImage = new Raster(config.imgName);
    this.puzzleImage.position = view.center;

    this.puzzleImage.visible = false;
    this.tileWidth = config.tileWidth;

    this.tilesPerRow = config.tilesPerRow;
    this.tilesPerColumn = config.tilesPerColumn;
    this.tileNum = this.tilesPerRow * this.tilesPerColumn;

    // output some info about this puzzle
    console.log("Game started : " + this.tileNum + " tiles(" + this.tilesPerRow + " rows * " + this.tilesPerColumn + " cols)");

    this.tileMarginWidth = this.tileWidth * 0.203125;
    this.selectedTile = undefined;
    this.selectedGroup = undefined;

    this.shadowScale = 1.5;
    this.tiles = createTiles(this.tilesPerRow, this.tilesPerColumn);
    // keep track of the steps of the current user
    this.steps = 0;

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

                var border = mask.clone();
                border.strokeColor = '#ccc'; //grey
                border.strokeWidth = 0;

                // each tile is a group of
                var tile = new Group(mask, img);
                tile.picking = false;
                tile.clipped = true;
                tile.opacity = .5;
                tile.pivot = new Point(32, 32);

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
                tile.relativePosition = new Point(0,0);
                tile.moved = false; // if one tile just clicked or actually moved(if moved, opacity=1)
                tile.groupID = -1; // to which group the tile belongs(-1 by default
                tile.grouped = false;

            }
        }
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


    function getTileRaster(sourceRaster, size, offset) {
        var targetRaster = new Raster('empty');
        var tileWithMarginWidth = size.width + instance.tileMarginWidth * 2;
        var data = sourceRaster.getImageData(new Rectangle(
            offset.x - instance.tileMarginWidth,
            offset.y - instance.tileMarginWidth,
            tileWithMarginWidth,
            tileWithMarginWidth));
        targetRaster.setImageData(data, new Point(0, 0))
        targetRaster.position = new Point(32, 32);
        return targetRaster;
    }

    function getTileIndex(tile){
        return new Number(tile.name.substr(5));
    }

    this.pickTile = function() {
        if (instance.selectedTile) {
            if (!instance.selectedTile[0].picking) {
                for(var i = 0; i < instance.selectedTile; i++){
                    instance.selectedTile[i].picking = true;
                }
            }
            else {
                if (instance.selectedTile[0].picking) {
                    instance.releaseTile();
                    return;
                }
            }

            instance.draging = true;

            var pos = new Point(instance.selectedTile[0].position.x, instance.selectedTile[0].position.y);
            for(var i = 0; i < instance.selectedTile.length; i++){
                var tile = instance.selectedTile[i];
                tile.position = pos + tile.relativePosition * instance.tileWidth;
            }
        }
    }

    this.releaseTile = function() {
        if (instance.draging) {

            var centerCellPosition = new Point(
                Math.round(instance.selectedTile[0].position.x / instance.tileWidth),
                Math.round(instance.selectedTile[0].position.y / instance.tileWidth));

            console.log("cellPosition : x : " + centerCellPosition.x + " y : " + centerCellPosition.y);

            var hasConflict = false;
            
            for(var i = 0; i < instance.selectedTile.length; i++){
                var tile = instance.selectedTile[i];

                var cellPosition = centerCellPosition + tile.relativePosition;

                var roundPosition = cellPosition * instance.tileWidth;
            
                var alreadyPlacedTile = getTileAtCellPosition(cellPosition);

                hasConflict = alreadyPlacedTile;

                var topTile = getTileAtCellPosition(cellPosition + new Point(0, -1));
                var rightTile = getTileAtCellPosition(cellPosition + new Point(1, 0));
                var bottomTile = getTileAtCellPosition(cellPosition + new Point(0, 1));
                var leftTile = getTileAtCellPosition(cellPosition + new Point(-1, 0));


                if (topTile && !topTile.picking) {
                    hasConflict = hasConflict || !(topTile.shape.bottomTab + tile.shape.topTab == 0);
                }

                if (bottomTile && !bottomTile.picking) {
                    hasConflict = hasConflict || !(bottomTile.shape.topTab + tile.shape.bottomTab == 0);
                }

                if (rightTile && !rightTile.picking) {
                    hasConflict = hasConflict || !(rightTile.shape.leftTab + tile.shape.rightTab == 0);
                }

                if (leftTile && !leftTile.picking) {
                    hasConflict = hasConflict || !(leftTile.shape.rightTab + tile.shape.leftTab == 0);
                }
            }

            if (!hasConflict) {

                if (instance.selectedTile[0].picking) {
                    for(var i = 0; i < instance.selectedTile.length; i++){
                        instance.selectedTile[i].picking = false;
                    }
                }

                for(var i = 0; i < instance.selectedTile.length; i++){
                    var tile = instance.selectedTile[i];

                    var cellPosition = centerCellPosition + tile.relativePosition;

                    var roundPosition = cellPosition * instance.tileWidth;

                    tile.position = roundPosition;
                    
                    tile.cellPosition = cellPosition;
                }

                instance.selectedTile = null;
                instance.draging = false;

                var errors = checkTiles();
                if (errors == 0) {
                    alert('Congratulations!!!');
                }
            }
        }
    }

    function getTileAtCellPosition(point) {
        var width = instance.tilesPerRow;
        var height = instance.tilesPerColumn;
        var tile = undefined;
        for (var i = 0; i < instance.tiles.length; i++) {
            if (instance.tiles[i].cellPosition == point) {
                tile = instance.tiles[i];
                break;
            }
        }
        return tile;
    }
    
    this.dragTile = function(delta) {
        if (instance.draging) {
            var centerPosition = instance.selectedTile[0].position;
            for(var i = 0; i < instance.selectedTile.length; i++){
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

    function dfsTiles(tile, array, relativePosition){
        for(var i = 0; i <array.length; i++){
            if(array[i] == tile)
                return;
        }
        tile.relativePosition = relativePosition;
        array.push(tile);
        for(var i = 0; i < 4; i++){
            var newPos = tile.cellPosition + directions[i];
            newTile = getTileAtCellPosition(newPos);
            if(newTile){
                dfsTiles(newTile, array, relativePosition + directions[i]);
            }
        }
    }

    this.mouseMove = function(point, delta) {
        if (!instance.draging) {
            if (delta.x < 8 && delta.y < 8) {
                var tolerance = instance.tileWidth * .5;
                var hit = false;
                for (var index = 0; index < instance.tiles.length; index++) {
                    var tile = instance.tiles[index];
                    var row = parseInt(index / config.tilesPerRow);
                    var col = index % config.tilesPerRow;

                    var tileCenter = tile.position;

                    var deltaPoint = tileCenter - point;
                    hit = (deltaPoint.x * deltaPoint.x + 
                                deltaPoint.y * deltaPoint.y) < tolerance * tolerance;
                    if (hit) {
                        instance.selectedTile = new Array();
                        dfsTiles(tile, instance.selectedTile, new Point(0,0));
                        for(var i = 0; i < instance.selectedTile.length; i++){
                            instance.selectedTile[i].opacity = .5;
                        }
                        return;
                    }
                    else {
                        if(instance.selectedTile){
                            instance.selectedTile = null;
                        }
                        tile.opacity = 1
                    }
                }
                if (!hit){
                    instance.selectedTile = null;
                }
            }
        }
        else {
            instance.dragTile(delta);
        }
    }

    this.dragOnlyTile = function(){
        if(instance.selectedTile){;
            for(var i = 1; i < instance.selectedTile.length; i++){
                instance.selectedTile[i].opacity = 1;
                instance.selectedTile[i].picking = false;
            }
            var tile = instance.selectedTile[0];
            instance.selectedTile = new Array();
            instance.selectedTile.push(tile);
        }
    }

    this.zoom = function(zoomDelta) {
        var newZoom = instance.currentZoom + zoomDelta;
        if (newZoom >= 0.3 && newZoom <= 1) {
            view.zoom = 
            instance.currentZoom = newZoom;
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
}