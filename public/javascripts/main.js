const requrl = window.location.protocol + '//' + window.location.host + '/';
var socket = io.connect(requrl);



/**
 * Send personal records to the server at the end of one game
 */
function sendRecord(round_id, finished, steps, time, totalLinks, hintedLinks, totalHintsNum, correctHintsNum, rating) {
    var params = {
        round_id: round_id,
        finished: finished,
        steps: steps,
        time: time,
        totalLinks: totalLinks,
        hintedLinks: hintedLinks,
        totalHintsNum: totalHintsNum,
        correctHintsNum: correctHintsNum,
        rating: rating
    };
    $.ajax({
        data: params,
        url: requrl + 'round/saveRecord',
        type: 'post',
        dataType: 'json',
        cache: false,
        timeout: 5000,
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