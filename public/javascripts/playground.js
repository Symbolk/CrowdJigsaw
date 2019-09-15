var socket = io.connect(window.location.protocol + '//' + window.location.host + '/');

//roundimageselector.js
var puzzleImageSrcSet = new Set();
//puzzleImageSrcSet.add("images/raw/starter_thumb.png");
// only relatively simple images in random rounds
var simpleImageSrcSet = new Set();
//var puzzle_size;
socket.on('simple_thumbnails', function (data) {
    if (data.thumblist.length > 0) {
        data.thumblist.forEach(function (item, index, input) {
            simpleImageSrcSet.add(item.image_path);
        });
    }
});
socket.on('thumbnails', function (data) {
    if (data.thumblist.length > 0) {
        data.thumblist.forEach(function (item, index, input) {
            puzzleImageSrcSet.add(item.image_path);
        });
        getSelectorImage();
    }
});

socket.on('create_round_failed', function(data) {
    if (data.username == username) {
        $.amaran({
            'title': data.title,
            'message': data.msg,
            'inEffect': 'slideRight',
            'cssanimationOut': 'zoomOutUp',
            'position': "top right",
            'delay': 2000,
            'closeOnClick': true,
            'closeButton': true
        });
    }
});

socket.on('roundChanged', function (data) {
    var round = data.round;
    round.players = data.players;
    roundsList[data.round_id] = round;
    //console.log(data.round.end_time, parseInt($('#rounddetail_id').text()));
    if(data.round.end_time != '-1' && data.round_id == parseInt($('#rounddetail_id').text())){
        roundDetailDialog.modal('hide');
    }
    if (data.username == username) {
        $.amaran({
            'title': data.title,
            'message': data.msg,
            'inEffect': 'slideRight',
            'cssanimationOut': 'zoomOutUp',
            'position': "top right",
            'delay': 2000,
            'closeOnClick': true,
            'closeButton': true
        });
        roundDetailCancelButton.removeAttr("disabled");
        roundDetailJoinButton.removeAttr("disabled");
        renderRoundDetail(round);
    }
    renderRoundList(roundsList);
    renderRoundPlayers(round);
});

socket.on('roundPlayersChanged', function (data) {
    var round = roundsList[data.round_id];
    if(!round){
        return;
    }
    round.players = data.players;
    renderRoundPlayers(round);
    if (data.username == username) {
        $.amaran({
            'title': data.title,
            'message': data.msg,
            'inEffect': 'slideRight',
            'cssanimationOut': 'zoomOutUp',
            'position': "top right",
            'delay': 2000,
            'closeOnClick': true,
            'closeButton': true
        });
        roundDetailCancelButton.removeAttr("disabled");
        roundDetailJoinButton.removeAttr("disabled");
        renderRoundDetail(round);
    }
});

// get the next page, and refresh the thumblist
socket.on("refresh", function (data) {
    $('.more_images').parent().parent().remove();
    puzzleImageSrcSet.clear();
    if (data.thumblist.length > 0) {
        data.thumblist.forEach(function (item, index, input) {
            puzzleImageSrcSet.add(item.image_path);
        });
        getSelectorImage();
    }
});
var imgReadyCount = 0;
var roundsList = {};
var roundsIDList = new Array();
var roundDetailDialog = $('#rounddetail_dialog');
var roundDetailJoinButton = $('#rounddetail_joinbutton');
var roundDetailCancelButton = $('#rounddetail_cancelbutton');
var roundDetailEdgeRow = $('#rounddetail_info_row');
var newRoundModal = $('#newroundModal');

var borderCheckbox = $('#border_checkbox_column');
var edgeCheckbox = $('#egde_checkbox_column');

var newRoundCreateButton = $('#newround_createbutton');
var newRoundCancelButton = $('#newround_cancelbutton');
var selectImageDialog = $('#selectimage_dialog').get(0);
var numSlider = $("#newround_number_slider").slider();
var sizeSlider = $("#puzzle_size_slider").slider();
var difficultSlider = $("#puzzle_difficult_slider").slider();
var pageCount = 0;
var theOnlyNewRoundDialog = false;
var selected_puzzle_size = sizeSlider.slider('getValue');
var selected_puzzle_difficult = difficultSlider.slider('getValue');
socket.emit('puzzle_size_update', { 
    puzzle_size: selected_puzzle_size,
    puzzle_difficult: selected_puzzle_difficult 
});

sizeSlider.slider().on('change',function (event) {
    selected_puzzle_size = event.value.newValue;
    selected_puzzle_difficult = difficultSlider.slider('getValue');
    $('#selectimage_table').empty();
    puzzleImageSrcSet.clear();
    pageCount=0;
    imgReadyCount=0;
    socket.emit('puzzle_size_update', { 
        puzzle_size: selected_puzzle_size,
        puzzle_difficult: selected_puzzle_difficult 
    });
    $('#newround_image').removeAttr('src');
    $('#newround_image_wrap').css('display', 'none');
})

difficultSlider.slider().on('change',function (event) {
    selected_puzzle_size = sizeSlider.slider('getValue');
    selected_puzzle_difficult = event.value.newValue;
    $('#selectimage_table').empty();
    puzzleImageSrcSet.clear();
    pageCount=0;
    imgReadyCount=0;
    socket.emit('puzzle_size_update', { 
        puzzle_size: selected_puzzle_size,
        puzzle_difficult: selected_puzzle_difficult 
    });
    $('#newround_image').removeAttr('src');
    $('#newround_image_wrap').css('display', 'none');
})

function getSelectorImage() {
    for (var thumb of puzzleImageSrcSet) {
        var imgSrc = thumb;
        var template = $($('#selectimage_template').html());
        var img = new Image();
        img.src = imgSrc;
        $(img).addClass('article-image');
        $(img).addClass('selector-image');
        img.onload = function () {
            imgReadyCount += 1;
            if (imgReadyCount >=  (pageCount+1) * 10 && !theOnlyNewRoundDialog) {
                allImageReadyCallback();
                theOnlyNewRoundDialog = true;
            }
        };
        template.find('.mdl-card__media').append(img);
        template.find('.mdl-card__title').append('<p class="text-center"><strong>'
            + imgSrc.slice(11, -10) + '</strong></p>');
        template.appendTo('#selectimage_table');
    }
    template = $($('#selectimage_template').html());
    template.find('.mdl-card__media').append('<button class="more_images button button-highlight button-box button-giant button-longshadow-right button-longshadow-expand"><i class="fa fa-chevron-right"></i></button>');
    template.find('.mdl-card__title').append('<p class="text-center"><strong> Load More Images </strong></p>');
    template.appendTo('#selectimage_table');
    $('.more_images').click(function () {
        pageCount += 1;
        socket.emit('nextPage', { 
            pageCount: pageCount, 
            puzzle_size: selected_puzzle_size,
            puzzle_difficult: selected_puzzle_difficult
        });
    });
    $('.selector-image').click(function () {
        var imgSrc = $(this).attr('src');
        $('#newround_image').attr('src', imgSrc);
        //$('#newround_blank').css('display', 'inline');
        selectImageDialog.close();
    });
}

function allImageReadyCallback() {
    initRoundDetailDialog();
    if (admin == "true") {
    //if (true) {
        initNewRoundDialog();
        initSelectImageDialog();
    }
    else {
        initNewRoundDialog();
        $('#newround_image_button').attr('disabled', 'true');
        $('#newround_image_button').text('Random Image');
    }
    getJoinableRounds();
}

function initRoundDetailDialog() {
    roundDetailJoinButton.click(function () {
        var roundID = $('#rounddetail_id').text();
        if (roundDetailJoinButton.text() == 'Join') {
            roundDetailJoinButton.attr('disabled',"true");
            joinRound(roundID);
        }
    });
    roundDetailCancelButton.click(function () {
        var roundID = $('#rounddetail_id').text();
        var round = roundsList[parseInt(roundID)];
        roundDetailJoinButton.removeAttr("disabled");
        if (roundDetailCancelButton.text() == 'Quit') {
            quitRound(roundID);
            roundDetailCancelButton.attr('disabled', 'true');
            roundDetailCancelButton.text('Close');
        }
        else {
            roundDetailDialog.modal('hide');
        }
    });

    $('.rounddetail-progress').click(function () {
        $('#players_list').toggle();
    });
}

function initRandomRoundDialog() {
    $('#shape_radio input').change(function () {
        if ($('.newround-shape-square').prop("checked")) {
            edgeCheckbox.remove();
        }
        else {
            edgeCheckbox.appendTo('#egde_checkbox_row');
        }
    });

    newRoundCreateButton.click(function () {
        var imgSrc = Array.from(simpleImageSrcSet)[Math.floor((Math.random() * (simpleImageSrcSet.size - 1)))];
        var playersNum = 1;
        var shape = 'jagged';
        var level = 1;
        var edge = false;
        var border = false;
        var algorithm = 'distribute';
        if ($('.newround-shape-square').prop("checked")) {
            shape = 'square';
            level = 2;
        }
        else {
            shape = 'jagged';
            level = 1;
            if ($('#egde_checkbox').prop("checked")) {
                edge = true;
            }
        }
        if ($('#border_checkbox').prop("checked")) {
            border = true;
        }
        var offical = false;
        if ($('#offical_checkbox').prop("checked")) {
            offical = true;
        }
        if ($('#old_radio').prop("checked")) {
            algorithm = 'central';
        }
        postNewRound(imgSrc, 0, 0, level, playersNum, shape, edge, border, algorithm, offical);
    });

    $('#player_num_div').css('display', 'none');
    $('#select_img_div').css('display', 'none');
    $('#puzzle_size_div').css('display','none');
    $('#puzzle_difficult_div').css('display','none');

    numSlider.slider('setValue', 1);
    $('#randomround_button').click(function () {
        //$('#newround_blank').css('display', 'inline');
        $('#newround_image').attr('src', '/images/logo.png')

        //newRoundModal.modal("show");
    });
}


function initNewRoundDialog() {

    $('#shape_radio input').change(function () {
        if ($('.newround-shape-square').prop("checked")) {
            edgeCheckbox.remove();
        }
        else {
            edgeCheckbox.appendTo('#egde_checkbox_row');
        }
    });

    newRoundCreateButton.click(function () {
        var imgSrc = $('#newround_image').attr('src');
        var playersNum = numSlider.slider('getValue');
        var size = sizeSlider.slider('getValue');
        var difficult = difficultSlider.slider('getValue');
        var shape = 'jagged';
        var level = 1;
        var edge = false;
        var border = false;
        var algorithm = 'distribute';
        if ($('.newround-shape-square').prop("checked")) {
            shape = 'square';
            level = 2;
        }
        else {
            shape = 'jagged';
            level = 1;
            if ($('#egde_checkbox').prop("checked")) {
                // shape = 'jagged_without_edge';
                edge = true;
            }
        }
        if ($('#border_checkbox').prop("checked")) {
            border = true;
        }
        var offical = false;
        if ($('#offical_checkbox').prop("checked")) {
            offical = true;
        }
        if ($('#old_radio').prop("checked")) {
            algorithm = 'central';
        }
        postNewRound(imgSrc, size, difficult, level, playersNum, shape, edge, border, algorithm, offical);
    });

    numSlider.slider({
        formatter: function (value) {
            return 'Current value: ' + value;
        }
    });

    if(admin != "true") {
        numSlider.change(function() {
            var num = parseInt($(this).val());
            console.log(num);
            if(num > 1) {
                $('#admin_key_div').css('display', 'inline');
            } else {
                $('#admin_key_div').css('display', 'none');
            }
        });
        $('#offical').css('display', 'none');
        $('#puzzle_difficult_div').css('display', 'none');
    }
    sizeSlider.slider({
        formatter: function (value) {
            return 'Current value: ' + value+"*"+value;
        }
    });

    difficultSlider.slider({
        formatter: function (value) {
            return 'Current value: ' + value;
        }
    });

    $('#newround_button').click(function () {
        //$('#admin_key_div').css('display', 'none');
        $('#newround_image_wrap').css('display', 'none');
        $('#newround_image').removeAttr('src');
    });
}

function initSelectImageDialog() {
    if (!selectImageDialog.showModal) {
        dialogPolyfill.registerDialog(selectImageDialog);
    }

    $('#newround_image').click(function () {
        if (!selectImageDialog.open) {
            selectImageDialog.showModal();
        }
    });

    $('#newround_image_button').click(function () {
        $('#newround_image_wrap').css('display', '');
        if (!selectImageDialog.open) {
            selectImageDialog.showModal();
        }
    });
}

function checkRoundStart(round){
    var roundID = round.round_id;
    if (round.start_time != '-1' || (round.players && (round.players.length == round.players_num || round.players_num == 1))) {
        if(round.players){
            for (var player of round.players) {
                if (username == player) {
                    if(round.start_time == '-1'){
                        startRound(roundID);
                    }
                    else{
                        startPuzzle(roundID);
                    }
                }
            }
        }
        return true;
    }
    return false;
}

function renderRoundPlayers(round) {
    var roundID = round.round_id;
    if (checkRoundStart(round)) {
        return;
    }
    var roundCard = null;
    if (roundsIDList[roundID]) {
        roundCard = $('#' + roundsIDList[roundID]);
        var roundCardNum = roundCard.find('.roundcard-num');
        var roundCardJoin = roundCard.find('.roundcard-join');
        roundCardNum.text(round.players.length + '/' + round.players_num);
    }

    for (var player of round.players) {
        if (username == player && !(($("element").data('bs.modal') || {}).isShown)) {
            renderRoundDetail(round);
        }
    }
}

function renderRoundDetail(round) {
    var roundID = round.round_id;
    if (!roundsList[roundID]) {
        roundDetailDialog.modal('hide');
        return;
    }
    roundsList[roundID] = round;

    var roundDetailImage = $('#rounddetail_image');
    var roundDetailID = $('#rounddetail_id');
    var roundDetailCreator = $('#rounddetail_author');
    var roundDetailCreateTime = $('#rounddetail_createtime');
    var roundDetailShapeImage = $('#rounddetail_shape_image');
    var roundDetailProgress = $('#rounddetail_progress');

    var roundDetailLevel = $('#rounddetail_level');
    var img = new Image();
    img.src = round.image;
    /*
    if (admin == "true") {
        roundDetailImage.attr('src', round.image);
    } else {
        roundDetailImage.attr('src', '/images/logo.png');
    }*/
    roundDetailImage.attr('src', '/images/logo.png');
    roundDetailID.text(round.round_id);
    roundDetailCreator.text(round.creator);
    roundDetailCreateTime.text(round.create_time);

    roundDetailEdgeRow.remove()
    if (round.shape == 'square') {
        roundDetailShapeImage.attr('src', '/images/square.jpg');
    }
    else {
        roundDetailShapeImage.attr('src', '/images/jagged.jpg');
        roundDetailEdgeRow.appendTo('#rounddetail_table');
        var info = "Edge: " + round.edge + "   " + "Border: " + round.border;
        $('#rounddetail_info').text(info);
    }

    roundDetailLevel.text('Level' + round.level);

    var roundDetailPlayerList = $('#rounddetail_playerlist');
    roundDetailPlayerList.empty();
    roundDetailJoinButton.text('Join');
    roundDetailCancelButton.text('Close');

    //roundDetailProgress.MaterialProgress.setProgress(100*round.players.length/round.players_num);
    roundDetailProgress.css('width', (100 * round.players.length / round.players_num) + '%');
    roundDetailProgress.text(round.players.length + '/' + round.players_num);
    for (var player of round.players) {
        var li = $($('#rounddetail_li_template').html());
        li.find('.player-name').text(player);
        li.appendTo('#rounddetail_playerlist');

        if (player == username) {
            if (round.creator == username) {
                roundDetailJoinButton.text('Start!');
                roundDetailJoinButton.click(function () {
                    if(round.start_time == '-1'){
                        startRound(roundID);
                    }
                });
            } else {
                roundDetailJoinButton.text('Waiting...');
            }
            roundDetailCancelButton.text('Quit');
            if (round.start_time == '-1' && round.players.length == round.players_num) {
                startRound(roundID);
            }
        }
    }

    if (round.end_time != '-1' || round.start_time != '-1') {
        roundDetailDialog.modal('hide');
        return;
    }
    if (!(($("element").data('bs.modal') || {}).isShown)) {
        roundDetailDialog.modal('show');
    }
}

function renderRoundList(data) {
    roundsList = {};
    for (var roundID in data) {
        var round = data[roundID];
        var roundID = round.round_id;

        if(round.end_time != '-1' || checkRoundStart(round)){
            continue;
        }

        var roundCard = null;
        if (roundsIDList[roundID]) {
            roundCard = $('#' + roundsIDList[roundID]);
        }
        else {
            var roundCardID = 'roundcard_' + roundID;
            roundsIDList[roundID] = roundCardID;
            var template = $('#roundcard_template');
            roundCard = $(template.html());
            roundCard.attr('id', roundCardID);
            // the latest round first
            roundCard.prependTo('#round_list');
        }
        roundsList[roundID] = round;

        var roundCardImage = roundCard.find('.roundcard-image');
        var roundCardTitle = roundCard.find('.roundcard-title');
        var roundCardJoin = roundCard.find('.roundcard-join');
        roundCardJoin.attr('id', roundID);
        roundCardJoin.click(function () {
            var roundID = $(this).attr('id');
            joinRound(roundID);
            renderRoundDetail(roundsList[roundID]);
        });
        /*
        if (admin == "true") {
            // roundCardImage.attr('src', round.image);
            var bg = 'url(\'/' + round.image + '\') center center';
            // roundCardImage.css("background", "url('/images/logo.png') center center");
            roundCardImage.css("background", bg);
        } else {
            roundCardImage.css("background", "url('/images/hide.jpg') center center");
            // roundCardImage.attr('src', '/images/logo.png');            
        }*/
        roundCardImage.css("background", "url('/images/hide.jpg') center center");
        roundCardTitle.text('Round ' + roundID);
        roundCard.find('.roundcard-level').text(round.level);
    }

    var roundCardprefix = 'roundcard_';
    var newRoundsIDList = new Array();
    for (var roundCardID of roundsIDList) {
        if (!roundCardID) {
            continue;
        }
        var roundID = parseInt(roundCardID.substr(roundCardprefix.length));
        if (!roundsList[roundID]) {
            var roundCard = $('#' + roundsIDList[roundID]);
            roundCard.remove();
        }
        else {
            newRoundsIDList[roundID] = roundCardID;
        }
    }
    roundsIDList = newRoundsIDList;
}

function getRoundPlayers(round) {
    $.ajax({
        url: requrl + 'round' + '/getRoundPlayers/' + round.round_id,
        type: 'get',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function (players) {
            round.players = players;
            renderRoundPlayers(round);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('error ' + textStatus + " " + errorThrown);
            $('#refresh_modal').modal({
                keyboard: false,
                backdrop: false
            });
        }
    });
}

function getJoinableRounds() {
    $.ajax({
        url: requrl + 'round' + '/getJoinableRounds',
        type: 'get',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function (data) {
            roundsList = {};
            for (var i = 0; i < data.length; i++) {
                var round = data[i];
                roundsList[round.round_id] = round;
                getRoundPlayers(round);
            }
            renderRoundList(roundsList);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('error ' + textStatus + " " + errorThrown);
            $('#refresh_modal').modal({
                keyboard: false,
                backdrop: false
            });
        }
    });
}

function postNewRound(imgSrc, size, difficult, level, playersNum, shape, edge, border, algorithm, offical) {
    if (imgSrc) {
        var img = new Image();
        var thumbStr = '_thumb';
        var thumbIndex = imgSrc.indexOf(thumbStr);
        if (thumbIndex >= 0) {
            imgSrc = imgSrc.substring(0, thumbIndex) + imgSrc.substring(thumbIndex + thumbStr.length);
        }
        img.src = imgSrc;
    }
    var param = {
        username: username,
        admin: admin == "true",
        imageURL: imgSrc,
        imageSize: size,
        difficult, difficult,
        level: level,
        edge: edge,
        shape: shape,
        border: border,
        players_num: playersNum,
        algorithm: algorithm,
        offical: offical,
    };
    if (admin != "true") {
        param.key = $('#newround_key_input').val();
    }
    socket.emit('newRound', param);
}


function quitRound(roundID) {
    socket.emit('quitRound', {round_id:roundID, username: username});
}

function joinRound(roundID) {
    socket.emit('joinRound', {round_id:roundID, username: username});
}

function startRound(roundID) {
    socket.emit('startRound', {round_id:roundID, username: username});
}

function startPuzzle(roundID) {
    window.location.href = requrl + 'puzzle?roundID=' + roundID;
}

