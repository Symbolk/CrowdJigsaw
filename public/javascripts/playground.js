var socket = io.connect(window.location.protocol + '//' + window.location.host + '/');
socket.on('roundChanged', function (data) {
    getJoinableRounds();
});
socket.on('hello', function (data) {
    console.log(data);
});
// get the next page, and refresh the thumblist
socket.on("refresh", function (data) {
    $('.more_images').parent().parent().remove();
    puzzleImageSrcSet = new Set();
    if (data.thumblist.length > 0) {
        data.thumblist.forEach(function (item, index, input) {
            puzzleImageSrcSet.add(item.image_path);
        });
        getSelectorImage();
    }
});
var imgReadyCount = 0;
var roundsList = new Array();
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
var mySlider = $("#newround_number_slider").slider();
var pageCount = 0;

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
            if (imgReadyCount >= simpleImageSrcSet.size + pageCount * 20 + 1) {
                allImageReadyCallback();
                console.log(imgReadyCount + ' images loaded.');
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
        socket.emit('nextPage', { pageCount: pageCount });
        pageCount += 1;
        console.log('Page ' + pageCount);
    });
    $('.selector-image').click(function () {
        var imgSrc = $(this).attr('src');
        $('#newround_image').attr('src', imgSrc);
        newRoundCreateButton.removeAttr('disabled');
        //$('#newround_blank').css('display', 'inline');
        selectImageDialog.close();
    });
}

function allImageReadyCallback() {

    initRoundDetailDialog();
    if (admin == "true") {
        initNewRoundDialog();
        initSelectImageDialog();
    }
    else {
        initRandomRoundDialog();
    }

    getJoinableRounds();
}

function initRoundDetailDialog() {
    roundDetailJoinButton.click(function () {
        var roundID = $('#rounddetail_id').text();
        if (roundDetailJoinButton.text() == 'Join') {
            joinRound(roundID);
        } else {
            getRound(roundID);
        }
    });
    roundDetailCancelButton.click(function () {
        var roundID = $('#rounddetail_id').text();
        var round = roundsList[parseInt(roundID)];
        if (roundDetailCancelButton.text() == 'Quit') {
            quitRound(roundID);
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

    // if (!newRoundDialog.showModal) {
    //     dialogPolyfill.registerDialog(newRoundDialog);
    // }
    newRoundCreateButton.click(function () {

        var imgSrc = Array.from(simpleImageSrcSet)[Math.floor((Math.random() * (simpleImageSrcSet.size - 1)))];
        console.log(imgSrc);
        var playersNum = 1;
        var shape = 'jagged';
        var level = 1;
        var edge = false;
        var border = false;
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

        postNewRound(imgSrc, level, playersNum, shape, edge, border);
        getJoinableRounds();
        //newRoundModal.modal("hide");
    });
    // newRoundCancelButton.click(function() {
    //     newRoundModal.modal("hide");
    // });

    $('#player_num_div').css('display', 'none');
    $('#select_img_div').css('display', 'none');
    //$('#newround_num_area').css('display','none');
    // $('#newround_number_slider').change(function() {
    //     $('#newround_num').text(1);
    // });

    mySlider.slider('setValue', 1);
    $('#randomround_button').click(function () {
        newRoundCreateButton.removeAttr('disabled');
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

    // if (!newRoundDialog.showModal) {
    //     dialogPolyfill.registerDialog(newRoundDialog);
    // }
    newRoundCreateButton.click(function () {
        var imgSrc = $('#newround_image').attr('src');
        var playersNum = mySlider.slider('getValue');
        var shape = 'jagged';
        var level = 1;
        var edge = false;
        var border = false;
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
        postNewRound(imgSrc, level, playersNum, shape, edge, border);
        getJoinableRounds();
        //newRoundModal.modal("hide");
    });
    // newRoundCancelButton.click(function() {
    //     console.log(newRoundModal);
    //     newRoundModal.modal("hide");
    // });

    //$('#newround_number_slider').css('display', 'inline');

    // $('#newround_number_slider').change(function() {
    //     $('#newround_num').text($('#newround_number_slider').val());
    // });

    mySlider.slider({
        formatter: function (value) {
            return 'Current value: ' + value;
        }
    });

    $('#newround_button').click(function () {
        newRoundCreateButton.attr('disabled', 'true');
        //$('#newround_blank').css('display', 'none');
        $('#newround_image_wrap').css('display', 'none');
        $('#newround_image').removeAttr('src');
        //newRoundDialog.showModal();
    });
}

function initSelectImageDialog() {
    if (!selectImageDialog.showModal) {
        dialogPolyfill.registerDialog(selectImageDialog);
    }

    $('#newround_image').click(function () {
        selectImageDialog.showModal();
    });

    $('#newround_image_button').click(function () {
        $('#newround_image_wrap').css('display', '');
        selectImageDialog.showModal();
    });

}


function renderRoundDetail(round) {
    var roundID = round.round_id;
    if (!roundsList[roundID]) {
        roundDetailDialog.modal('hide');
        getJoinableRounds();
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

    if (admin == "true") {
        roundDetailImage.attr('src', round.image);
    } else {
        roundDetailImage.attr('src', '/images/logo.png');
    }
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

    //roundDetailProgress.MaterialProgress.setProgress(100*round.players.length/round.players_num);
    roundDetailProgress.css('width', (100 * round.players.length / round.players_num) + '%');
    roundDetailProgress.text(round.players.length + '/' + round.players_num);

    roundDetailLevel.text('Level' + round.level);

    var roundDetailPlayerList = $('#rounddetail_playerlist');
    roundDetailPlayerList.empty();
    roundDetailJoinButton.text('Join');
    roundDetailCancelButton.text('Close');
    for (var player of round.players) {
        var li = $($('#rounddetail_li_template').html());
        li.find('.player-name').text(player.player_name);
        li.appendTo('#rounddetail_playerlist');

        if (player.player_name == username) {
            if (round.creator == username) {
                roundDetailJoinButton.text('Start!');
                roundDetailJoinButton.click(function () {
                    startRound(roundID);
                });
            } else {
                roundDetailJoinButton.text('Waiting...');
            }
            roundDetailCancelButton.text('Quit');
            if (round.players.length == round.players_num) {
                startRound(roundID);
            }
        }
    }


    if (!(($("element").data('bs.modal') || {}).isShown)) {
        roundDetailDialog.modal('show');
    }
}

function getRound(roundID) {
    $.ajax({
        url: requrl + 'round' + '/getRound/' + roundID,
        type: 'get',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function (data) {
            renderRoundDetail(data);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('error ' + textStatus + " " + errorThrown);
        }
    });
}

function renderRoundList(data) {
    roundsList = new Array();
    for (var round of data) {
        var roundID = round.round_id;

        if (round.start_time != '-1') {
            for (var player of round.players) {
                if (username == player.player_name) {
                    startPuzzle(roundID);
                }
            }
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
        var roundCardNum = roundCard.find('.roundcard-num');
        var roundCardJoin = roundCard.find('.roundcard-join');
        roundCardJoin.attr('id', roundID);

        if (admin == "true") {
            // roundCardImage.attr('src', round.image);
            var bg = 'url(\'/' + round.image + '\') center center';
            // roundCardImage.css("background", "url('/images/logo.png') center center");
            roundCardImage.css("background", bg);
        } else {
            roundCardImage.css("background", "url('/images/hide.jpg') center center");
            // roundCardImage.attr('src', '/images/logo.png');            
        }
        roundCardTitle.text('Round ' + roundID);
        roundCard.find('.roundcard-level').text(round.level);
        roundCardNum.text(round.players.length + '/' + round.players_num);
        roundCardJoin.click(function () {
            var roundID = $(this).attr('id');
            getRound(roundID);
        });
        for (var player of round.players) {
            if (username == player.player_name && !(($("element").data('bs.modal') || {}).isShown)) {
                getRound(roundID);
            }
        }
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

    if (($("element").data('bs.modal') || {}).isShown) {
        var roundIDStr = $('#rounddetail_id').text();
        var roundID = parseInt(roundIDStr);
        getRound(roundID);
    }
}

function getJoinableRounds() {
    $.ajax({
        url: requrl + 'round' + '/getJoinableRounds',
        type: 'get',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function (data) {
            // console.log(data);
            renderRoundList(data);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('error ' + textStatus + " " + errorThrown);
        }
    });
}

function postNewRound(imgSrc, level, playersNum, shape, edge, border) {
    var img = new Image();
    var thumbStr = '_thumb';
    var thumbIndex = imgSrc.indexOf(thumbStr);
    if (thumbIndex >= 0) {
        imgSrc = imgSrc.substring(0, thumbIndex) + imgSrc.substring(thumbIndex + thumbStr.length);
    }
    img.src = imgSrc;
    var param = {
        imageURL: imgSrc,
        level: level,
        edge: edge,
        shape: shape,
        border: border,
        players_num: playersNum,
    };

    $.ajax({
        data: param,
        url: requrl + 'round' + '/newRound',
        type: 'post',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function (data) {
            $.amaran({
                'title': 'joinRound',
                'message': data.msg,
                'inEffect': 'slideRight',
                'cssanimationOut': 'zoomOutUp',
                'position': "top right",
                'delay': 2000,
                'closeOnClick': true,
                'closeButton': true
            });
            var roundID = data.round_id;
            joinRound(roundID);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('error ' + textStatus + " " + errorThrown);
        }
    });
}


function quitRound(roundID) {
    var round = roundsList[roundID];
    $.ajax({
        url: requrl + 'round' + '/quitRound/' + roundID,
        type: 'get',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function (data) {
            $.amaran({
                'title': 'quitRound',
                'message': 'You just quit ' + roundID,
                'inEffect': 'slideRight',
                'cssanimationOut': 'zoomOutUp',
                'position': "top right",
                'delay': 2000,
                'closeOnClick': true,
                'closeButton': true
            });
            getJoinableRounds();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('error ' + textStatus + " " + errorThrown);
        }
    });
}

function joinRound(roundID) {
    var round = roundsList[roundID];
    var param = {
        round_id: roundID
    };
    $.ajax({
        data: param,
        url: requrl + 'round' + '/joinRound',
        type: 'post',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function (data) {
            $.amaran({
                'title': 'joinRound',
                'message': 'You just join ' + roundID,
                'inEffect': 'slideRight',
                'cssanimationOut': 'zoomOutUp',
                'position': "top right",
                'delay': 2000,
                'closeOnClick': true,
                'closeButton': true
            });
            getJoinableRounds(roundID);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('error ' + textStatus + " " + errorThrown);
        }
    });
    // /**
    //  * Report to the server
    //  */
    socket.emit('join', { player_name: username });
}

function startRound(roundID) {
    $.ajax({
        url: requrl + 'round' + '/startRound/' + roundID,
        type: 'get',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function (data) {
            getJoinableRounds();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('error ' + textStatus + " " + errorThrown);
        }
    });
}

function startPuzzle(roundID) {
    window.location.href = requrl + 'puzzle?roundID=' + roundID;
}

