/*var paper = require('paper');
paper.setup([1080, 1080]);

getTiles('../public/images/starter.jpg', 4, 4, null);
*/
function getTiles(imgSrc, tilesPerRow, tilesPerColumn, shapeArray){
    var puzzleImage = new paper.Raster('http://assets.paperjs.org/images/marilyn.jpg');
    console.log(puzzleImage);
}

function getMask(topTab, rightTab, bottomTab, leftTab, tileWidth) {
    var tileRatio = tileWidth / 100.0;
    var curvyCoords = [
        0, 0, 35, 15, 37, 5,
        37, 5, 40, 0, 38, -5,
        38, -5, 20, -20, 50, -20,
        50, -20, 80, -20, 62, -5,
        62, -5, 60, 0, 63, 5,
        63, 5, 65, 15, 100, 0
    ];

    var mask = new paper.Path();

    var topLeftEdge = new paper.Point(0, 0);

    mask.moveTo(topLeftEdge);

    //Top
    for (var i = 0; i < curvyCoords.length / 6; i++) {
        var p1 = new paper.Point(curvyCoords[i * 6 + 0] * tileRatio + topLeftEdge.x, 
            topTab * curvyCoords[i * 6 + 1] * tileRatio + topLeftEdge.y);
        var p2 = new paper.Point(curvyCoords[i * 6 + 2] * tileRatio + topLeftEdge.x, 
            topTab * curvyCoords[i * 6 + 3] * tileRatio + topLeftEdge.y);
        var p3 = new paper.Point(curvyCoords[i * 6 + 4] * tileRatio + topLeftEdge.x, 
            topTab * curvyCoords[i * 6 + 5] * tileRatio + topLeftEdge.y);
        mask.cubicCurveTo(p1, p2, p3);
    }
    //Right
    var topRightEdge = new paper.Point(tileWidth + topLeftEdge.x, topLeftEdge.y);
    for (var i = 0; i < curvyCoords.length / 6; i++) {
        var p1 = new paper.Point(-rightTab * curvyCoords[i * 6 + 1] * tileRatio + topRightEdge.x, 
            curvyCoords[i * 6 + 0] * tileRatio + topRightEdge.y);
        var p2 = new paper.Point(-rightTab * curvyCoords[i * 6 + 3] * tileRatio + topRightEdge.x, 
            curvyCoords[i * 6 + 2] * tileRatio + topRightEdge.y);
        var p3 = new paper.Point(-rightTab * curvyCoords[i * 6 + 5] * tileRatio + topRightEdge.x, 
            curvyCoords[i * 6 + 4] * tileRatio + topRightEdge.y);
        mask.cubicCurveTo(p1, p2, p3);
    }
    //Bottom
    var bottomRightEdge = new paper.Point(topRightEdge.x, tileWidth + topRightEdge.y);
    for (var i = 0; i < curvyCoords.length / 6; i++) {
        var p1 = new paper.Point(bottomRightEdge.x - curvyCoords[i * 6 + 0] * tileRatio, 
            bottomRightEdge.y - bottomTab * curvyCoords[i * 6 + 1] * tileRatio);
        var p2 = new paper.Point(bottomRightEdge.x - curvyCoords[i * 6 + 2] * tileRatio, 
            bottomRightEdge.y - bottomTab * curvyCoords[i * 6 + 3] * tileRatio);
        var p3 = new paper.Point(bottomRightEdge.x - curvyCoords[i * 6 + 4] * tileRatio, 
            bottomRightEdge.y - bottomTab * curvyCoords[i * 6 + 5] * tileRatio);
        mask.cubicCurveTo(p1, p2, p3);
    }
    //Left
    var bottomLeftEdge = new paper.Point(bottomRightEdge.x - tileWidth, bottomRightEdge.y);
    for (var i = 0; i < curvyCoords.length / 6; i++) {
        var p1 = new paper.Point(bottomLeftEdge.x + leftTab * curvyCoords[i * 6 + 1] * tileRatio, 
            bottomLeftEdge.y - curvyCoords[i * 6 + 0] * tileRatio);
        var p2 = new paper.Point(bottomLeftEdge.x + leftTab * curvyCoords[i * 6 + 3] * tileRatio, 
            bottomLeftEdge.y - curvyCoords[i * 6 + 2] * tileRatio);
        var p3 = new paper.Point(bottomLeftEdge.x + leftTab * curvyCoords[i * 6 + 5] * tileRatio, 
            bottomLeftEdge.y - curvyCoords[i * 6 + 4] * tileRatio);
        mask.cubicCurveTo(p1, p2, p3);
    }
    return mask;
}

function getRandomShapes(width, height, shapeType, hasEdge) {
    var getRandomTabValue = function() {
        //math.floor() returns max int <= arg
        switch (shapeType) {
            case 'square': {
                return 0;
                break;
            }
            case 'jagged': {
                return Math.pow(-1, Math.floor(Math.random() * 2));;
                break;
            }
            default: {
                return 0;
            }
        }
    };

    var shapeArray = new Array();
    for (var y = 0; y < height; y++) {
        for (var x = 0; x < width; x++) {
            var topTab = undefined;
            var rightTab = undefined;
            var bottomTab = undefined;
            var leftTab = undefined;
            if (y == 0){
                topTab = (hasEdge == 'true') ? 0 : getRandomTabValue();
            }
            if (y == height - 1){
                bottomTab = (hasEdge == 'true') ? 0 : getRandomTabValue();
            }
            if (x == 0){
                leftTab = (hasEdge == 'true') ? 0 : getRandomTabValue();
            }
            if (x == width - 1){
                rightTab = (hasEdge == 'true') ? 0 : getRandomTabValue();
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
    return JSON.stringify(shapeArray);
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
    var strHour=date.getHours();
    var strMinute=date.getMinutes();
    var strSecond=date.getSeconds();
    var strMilSecond=date.getMilliseconds();
    if (strHour >= 0 && strHour <= 9) {
        strHour = "0" + strHour;
    }
    if (strMinute >= 0 && strMinute <= 9) {
        strMinute = "0" + strMinute;
    }
    if (strSecond >= 0 && strSecond <= 9) {
        strSecond = "0" + strSecond;
    }
    var currentdate = date.getFullYear() + seperator1 + month + seperator1 + strDate
        + " " + strHour + seperator2 + strMinute
        + seperator2 + strSecond + seperator2 + strMilSecond;
    return currentdate;
}

/**
 * Descending compare
 * @param {*} prop 
 */
var descending = function (prop) {
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
/**
 * Ascending compare
 * @param {*} prop 
 */
var ascending = function (prop) {
    return function (obj1, obj2) {
        var val1 = obj1[prop];
        var val2 = obj2[prop];
        if (!isNaN(Number(val1)) && !isNaN(Number(val2))) {
            val1 = Number(val1);
            val2 = Number(val2);
        }
        if (val1 < val2) {
            return -1;
        } else if (val1 > val2) {
            return 1;
        } else {
            return 0;
        }            
    } 
}

exports.getNowFormatDate=getNowFormatDate;
exports.descending=descending;
exports.ascending=ascending;
exports.getRandomShapes = getRandomShapes;