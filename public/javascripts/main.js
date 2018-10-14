const requrl = window.location.protocol + '//' + window.location.host + '/';
var socket = io.connect(requrl);
socket.on('connect_error', function(data){
    console.log(data + ' - connect_error');
    location.reload()
});

/**
 * Send personal records to the server at the end of one game
 */
function sendRecord(round_id, username, finished, steps, startTime, totalLinks, hintedLinks, totalHintsNum, correctHintsNum, rating) {
    var params = {
        round_id: round_id,
        username: username,
        finished: finished,
        steps: steps,
        startTime: startTime,
        totalLinks: totalLinks,
        hintedLinks: hintedLinks,
        totalHintsNum: totalHintsNum,
        correctHintsNum: correctHintsNum,
        rating: rating
    };
    socket.emit('saveRecord', params);
    /*
    $.ajax({
        data: params,
        url: requrl + 'round/saveRecord',
        type: 'post',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function (data) {
            $.amaran({
                'title': 'saveRecord',
                'message': data.msg,
                'inEffect': 'slideRight',
                'cssanimationOut': 'zoomOutUp',
                'position': "top right",
                'delay': 2000,
                'closeOnClick': true,
                'closeButton': true
            });
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('saveRecord: ' + 'error ' + textStatus + " " + errorThrown);
        }
    });*/
}

function getUrlParams(key) {
    var reg = new RegExp("(^|&)" + key + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]); return null;
}