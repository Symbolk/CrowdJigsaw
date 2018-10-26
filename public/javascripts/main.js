const requrl = window.location.protocol + '//' + window.location.host + '/';
var socket = io.connect(requrl);
socket.on('connect_error', function(data){
    if($('#refresh_modal').get(0)){
        $('#refresh_modal').modal({
            keyboard: false,
            backdrop: false
        });
    }
    else {
        location.reload();
    }
});

function getUrlParams(key) {
    var reg = new RegExp("(^|&)" + key + "=([^&]*)(&|$)");
    var r = window.location.search.substr(1).match(reg);
    if (r != null) return unescape(r[2]); return null;
}