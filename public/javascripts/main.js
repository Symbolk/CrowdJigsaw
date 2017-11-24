const requrl = 'http://162.105.89.66:3000/';
//const requrl = 'http://39.106.112.44:3000/';

/**
 *  Update links in the background graph bidirectionally
 *  Check which case it is in the 4 cases, and call the corrosponding method:
 *  *  When one link is made:
 *  1, If the link does not exist, create a link;
 *  2, If the link already exists, update: append the user to the supporter list of the selected tile;
 *  *  When one link is destroyed:
 *  1, If the user is the only one supporter, remove;
 *  2, Else update: remove the user from the supporter list of the 2 tiles
 */

/**
* Check links change of the selected tile(s), and update the database
* @param selectedTileIndex  Number the selected tile index
* @param currentAroundTiles Array the current tiles around after releasing{ tileIndex: direction(from selected tile to this tile)}
* e.g. checkLinks(0, [
*              { 0: 1 }, 
*              { 1: 5 }
* ]);
* @return ifSucceed Boolean
*/
function checkLinks(selectedTileIndex, aroundTileIndexes) {
    selectedTileIndex = Number(selectedTileIndex);

    // Retrieve the last around tile indexes from the server
    var lastAroundTileIndexes = new Array(-1, -1, -1, -1);
    $.ajax({
        url: requrl + 'getLinks/' + selectedTileIndex,
        type: 'get',
        // contentType: 'application/json',
        dataType: 'json',
        // async: false,
        cache: false,
        timeout: 5000,
        success: function (data) {
            // var data = $.parseJSON(data)
            // if(!data.empty){
                for (var d of data) {
                    // for(var s of d.supporters){
                    //     console.log(s);
                    // }
                    lastAroundTileIndexes[Number(d.supporters[0].direction)] = Number(d.to);
                }
            // }
            // Do a diff for the 2 arrays
            // Update the database according to the diff
            for (var i = 0; i < 4; i++) {
                aroundTileIndexes[i] = Number(aroundTileIndexes[i]);
                lastAroundTileIndexes[i] = Number(lastAroundTileIndexes[i]);
                // if there is a change in around tile
                if (lastAroundTileIndexes[i] != aroundTileIndexes[i]) {
                    // Case1 : create
                    if (lastAroundTileIndexes[i] == -1) {
                        var params = {
                            from: selectedTileIndex,
                            to: aroundTileIndexes[i],
                            dir: i
                        };
                        supportLink(params);
                    } else if (aroundTileIndexes[i] == -1) {
                        // Case 2: unsupport
                        var params = {
                            from: selectedTileIndex,
                            to: lastAroundTileIndexes[i]
                        };
                        forgetLink(params);
                    } else {
                        // Case 3: update
                        var oldLink = {
                            from: selectedTileIndex,
                            to: lastAroundTileIndexes[i]
                        };
                        forgetLink(oldLink);
                        var newLink = {
                            from: selectedTileIndex,
                            to: aroundTileIndexes[i],
                            dir: i
                        }
                        supportLink(newLink);
                    }
                }
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('error ' + textStatus + " " + errorThrown);
            return false;
        }
    });
    return true;
}

/**
 * Retrieve data from the server and return hint tiles for the player
 * @param  selectedTileIndex
 * @return hintTileIndexes
 */
function getHints(selectedTileIndex) {
    // var hintTileIndexes=new Array(-1,-1,-1,-1);
    $.ajax({
        url: requrl + 'getHints' + '/' + selectedTileIndex,
        type: 'get',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function (data) {
            // var data = $.parseJSON(data);
            // indexes = directions(0 1 2 3=T R B L)
            return data;
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('error ' + textStatus + " " + errorThrown);
        }
    });
}


/**
 * TEST : to produce data
 *  *  When one link is built:
 *  1, If the link does not exist, create a link;
 *  2, If the link already exists, update: append the user to the supporter list of the selected tile;
 * * Logs: 
 * ++ : new a link and the current user is the first supporter 
 */
function createLink(params) {

    // Case 1: build new links only
    // check if this link exists in the db
    $.ajax({
        url: requrl + 'exist/' + params.from + '/' + params.to,
        type: 'get',
        // contentType: 'application/json',
        dataType: 'json',
        // async: false,
        cache: false,
        timeout: 5000,
        success: function (data) {
            // var data = $.parseJSON(data);
            if (data.count == 0) {
                $.ajax({
                    data: params,
                    url: requrl + 'create',
                    type: 'post',
                    dataType: 'json',
                    cache: false,
                    success: function (data) {
                        console.log(data.msg + ' ' + params.from + ' --> ' + params.to);
                    },
                    error: function (jqXHR, textStatus, errorThrown) {
                        console.log('error ' + textStatus + " " + errorThrown);
                    }
                });
            } else {
                supportLink(params);
                // forgetLink(params);
            }
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('error ' + textStatus + " " + errorThrown);
        }
    });
}

/**
 *  1，append the user to the supporter list of the selected tile
 * + : add one supporter for the link
 */
function supportLink(params) {
    $.ajax({
        data: params,
        url: requrl + 'support',
        type: 'post',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function (data) {
            // data.msg : ++ or +
            console.log(data.msg + ' ' + params.from + ' --> ' + params.to);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('error ' + textStatus + " " + errorThrown);
        }
    });
}

/**
 *  2, remove the user from the supporter list of the 2 tiles  
 * - : reduce one supporter for the link
 */
function forgetLink(params) {
    $.ajax({
        data: params,
        url: requrl + 'forget',
        type: 'post',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function (data) {
            // data.msg : -- or -            
            console.log(data.msg + ' ' + params.from + ' --> ' + params.to);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('error ' + textStatus + " " + errorThrown);
        }
    });
}

/**
 * Send personal records to the server at the end of one game
 */
function sendRecord(level, when, steps, time) {
    var params={
        level: level,
        when: when,
        steps: steps,
        time: time
    };
    $.ajax({
        data: params,
        url: requrl + 'record',
        type: 'post',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function (data) {
          console.log(data.msg);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('error ' + textStatus + " " + errorThrown);
        }
    });
}

function getUrlParams(key) {
    var reg = new RegExp("(^|&)" + key + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]); return null;
}