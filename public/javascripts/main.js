const requrl = window.location.protocol + '//' + window.location.host + '/';

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
    var aroundTiles = new Array();
    for (var i = 0; i < 4; i++) {
        var aroundTile = {
            before: Number(aroundTilesBefore[i]),
            after: Number(aroundTilesAfter[i])
        }
        aroundTiles.push(aroundTile);
    }
    var params = {
        round_id: round_id,// get from newRound()
        selectedTile: selectedTileIndex,
        aroundTiles: JSON.stringify(aroundTiles)
    };
    // send a request to post this step to the server
    $.ajax({
        data: params,
        url: requrl + 'graph/check',
        type: 'post',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function (data) {
            console.log(data);
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
 * Send personal records to the server at the end of one game
 */
function sendRecord(round_id, finished, steps, time) {
    var params = {
        round_id: round_id,
        finished: finished,
        steps: steps,
        time: time
    };
    $.ajax({
        data: params,
        url: requrl + 'round/saveRecord',
        type: 'post',
        dataType: 'json',
        cache: false,
        timeout: 2000,
        success: function (data) {
            console.log('Record: ' + data.contribution);
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