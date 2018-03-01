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
        + seperator2 + strSecond;
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

function getRandomShapes(width, height, shapeType, hasEdge) {
    console.log(hasEdge);
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

exports.getNowFormatDate=getNowFormatDate;
exports.descending=descending;
exports.ascending=ascending;
exports.getRandomShapes = getRandomShapes;