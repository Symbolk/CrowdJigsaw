const requrl = 'http://localhost:3000/'; //local dev
// const requrl = 'http://39.106.112.44:3000/';  //server dep

/**
 *  Update links in the background graph
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
* @return ifSucceed Boolean
*/
function checkLinks(round_id, selectedTileIndex, aroundTilesBefore, aroundTilesAfter) {
    selectedTileIndex = Number(selectedTileIndex);

    // format the params into a json object
    var params={
        "round_id": round_id,// get from newRound()
        "selectedTile": selectedTileIndex,
        "aroundTiles":  new Array()
    };
    for(var i=0;i<4;i++){
        var aroundTile={
            "before": Number(aroundTilesBefore[i]),
            "after": Number(aroundTilesAfter[i])
        }
        params.aroundTiles.push(aroundTile);
    }
    console.log(params);
    // send a request to post this step to the server
    $.ajax({
        data: params,
        url: requrl + 'graph/check',
        type: 'post',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function (data) {
            if(data.hasOwnProperty("msg")){
                console.log('checkLinks: ' + data.msg);
            }else{
                console.log('checkLinks: ' + data.msg1);
                console.log('checkLinks: ' + data.msg2);
            }
          return true;
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('checkLinks: ' + 'error ' + textStatus + " " + errorThrown);
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
            console.log('getHints: ' + data);
            return data;
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('getHints: ' + 'error ' + textStatus + " " + errorThrown);
        }
    });
}

/**
 * Send personal records to the server at the end of one game
 */
function sendRecord(round_id, steps, time) {
    var params={
        steps: steps,
        time: time,
        round_id: round_id
    };
    $.ajax({
        data: params,
        url: requrl + 'user/saveRecord',
        type: 'post',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function (data) {
          console.log('saveRecord: ' + data.msg);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('saveRecord: ' + 'error ' + textStatus + " " + errorThrown);
        }
    });
}

function getUrlParams(key) {
    var reg = new RegExp("(^|&)" + key + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]); return null;
}