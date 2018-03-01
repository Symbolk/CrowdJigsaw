var imgReadyCount = 0;
var roundsList = new Array();
var roundsIDList = new Array();
var roundDetailDialog = $('#rounddetail_dialog').get(0);
var roundDetailJoinButton = $('#rounddetail_joinbutton');
var roundDetailCancelButton = $('#rounddetail_cancelbutton');
var roundDetailEdgeRow = $('#rounddetail_info_row');
var newRoundDialog = $('#newround_dialog').get(0);
var newRoundCheckBoxRow = $('#egde_checkbox_row');
var newRoundCreateButton = $('#newround_createbutton');
var newRoundCancelButton = $('#newround_cancelbutton');
var selectImageDialog = $('#selectimage_dialog').get(0);

getSeletorImage();

function getSeletorImage(){
    for(var i = 0; i < puzzleImageSrcList.length; i++){
        var imgSrc = puzzleImageSrcList[i];
        var template = $($('#selectimage_template').html());
        var img = new Image();
        img.src = imgSrc;
        $(img).addClass('article-image');
        $(img).addClass('selector-image');
        img.onload = function(){
            imgReadyCount += 1;
            if(imgReadyCount == puzzleImageSrcList.length){
                 allImageReadyCallback();
            }
        };
        template.find('.mdl-card__media').append(img);
        template.appendTo('#selectimage_table');
    }
    $('.selector-image').click(function(){
        var imgSrc = $(this).attr('src');
        $('#newround_image').attr('src', imgSrc);
        newRoundCreateButton.removeAttr('disabled');
        $('#newround_blank').css('display', 'inline');
        selectImageDialog.close();
    });
}

function allImageReadyCallback(){
    console.log('Images Loaded.');

    initRoundDetailDialog();
    initNewRoundDialog();
    initSelectImageDialog();

    var getJoinableRoundsInterval = setInterval(getJoinableRounds, 3000);
    getJoinableRounds();
}

function initRoundDetailDialog(){
    if (!roundDetailDialog.showModal) {
        dialogPolyfill.registerDialog(roundDetailDialog);
    }
    roundDetailJoinButton.click(function() {
        var roundID = $('#rounddetail_id').text();
        if(roundDetailJoinButton.text() == 'Join'){
            joinRound(roundID);
        }
        else{
            getRound(roundID);
        }
    });
    roundDetailCancelButton.click(function() {
        var roundID = $('#rounddetail_id').text();
        var round = roundsList[parseInt(roundID)];
        if(roundDetailCancelButton.text() == 'Quit'){
            quitRound(roundID);
            roundDetailCancelButton.text('Close');
        }
        else{
            roundDetailDialog.close();
        }
    });

    $('.rounddetail-progress').click(function () {
        $('#players_list').toggle();
    });
}


function initNewRoundDialog(){

    $('#shape_radio input').change(function() {
        if($('.newround-shape-square').prop( "checked" )){
            newRoundCheckBoxRow.remove();
        }
        else{
            newRoundCheckBoxRow.appendTo('#newround_table');
        }
    });

    if (!newRoundDialog.showModal) {
        dialogPolyfill.registerDialog(newRoundDialog);
    }
    newRoundCreateButton.click(function() {
        var imgSrc = $('#newround_image').attr('src');
        var playersNum = $('#newround_number_slider').val();
        var shape = 'jagged';
        var level = 1;
        var edge = false;
        var border = false;
        if($('.newround-shape-square').prop( "checked" )){
            shape = 'square';
            level = 2;
        }
        else{
            shape = 'jagged';
            level = 1;
            if ($('#egde_checkbox').prop( "checked" )) {
                // shape = 'jagged_without_edge';
                edge = true;
            }
            if($('#border_checkbox').prop("checked")){
                border = true;
            }
        }
        postNewRound(imgSrc, level, playersNum, shape, edge, border);
        getJoinableRounds();
        newRoundDialog.close();
    });
    newRoundCancelButton.click(function() {
        newRoundDialog.close();
    });
    $('#newround_number_slider').change(function() {
        $('#newround_num').text($('#newround_number_slider').val());
    });

    $('#newround_button').click(function(){
        newRoundCreateButton.attr('disabled','true');
        $('#newround_blank').css('display', 'none');
        $('#newround_image').removeAttr('src')
        newRoundDialog.showModal();
    });

    $('#newround_button').mousedown(function(){
        $('#newround_button').css("background-color", "rgba(200, 200, 200, 0.9)")
    });

    $('#newround_button').mouseup(function(){
        $('#newround_button').css("background-color", "rgba(200, 200, 200, 0.5)")
    });

    $('#newround_button').mouseover(function(){
        $('#newround_button').css("background-color", "rgba(200, 200, 200, 0.9)")
    });

    $('#newround_button').mouseout(function(){
        $('#newround_button').css("background-color", "rgba(200, 200, 200, 0.5)")
    });

}

function initSelectImageDialog(){
    if (!selectImageDialog.showModal) {
        dialogPolyfill.registerDialog(selectImageDialog);
    }

    $('#newround_image').click(function() {
        selectImageDialog.showModal();
    });

    $('#newround_image_button').click(function() {
        selectImageDialog.showModal();
    });
}


function renderRoundDetail(round){
    var roundID = round.round_id;
    if(!roundsList[roundID]){
        roundDetailDialog.close()
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

    if(admin=="true"){
        roundDetailImage.attr('src', round.image);
    }else{
        roundDetailImage.attr('src', '/images/logo.png');            
    }
    roundDetailID.text(round.round_id);
    roundDetailCreator.text(round.creator);
    roundDetailCreateTime.text(round.create_time);

    roundDetailEdgeRow.remove()
    if(round.shape == 'square'){
        roundDetailShapeImage.attr('src', '/images/square.jpg');
    }
    else{
        roundDetailShapeImage.attr('src', '/images/jagged.jpg');
        roundDetailEdgeRow.appendTo('#rounddetail_table');
        var info="Edge: "+round.edge+"   "+"Border: " + round.border;
        $('#rounddetail_info').text(info);
    }

    //roundDetailProgress.MaterialProgress.setProgress(100*round.players.length/round.players_num);
    roundDetailProgress.css('width', (100*round.players.length/round.players_num) + '%');
    roundDetailProgress.text(round.players.length + '/' + round.players_num);

    roundDetailLevel.text('Level' + round.level);
    
    var roundDetailPlayerList = $('#rounddetail_playerlist');
    roundDetailPlayerList.empty();
    roundDetailJoinButton.text('Join');
    roundDetailCancelButton.text('Close');
    for(var player of round.players){
        var li = $($('#rounddetail_li_template').html());
        li.find('.player-name').text(player.player_name);
        li.appendTo('#rounddetail_playerlist');
        
        if(player.player_name == username){
            roundDetailJoinButton.text('Waiting...');
            roundDetailCancelButton.text('Quit');
            if(round.players.length == round.players_num){
                startRound(roundID);
            }
        }
    }


    if(!roundDetailDialog.open){
        roundDetailDialog.showModal();
    }
}

function getRound(roundID){
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

function renderRoundList(data){
    roundsList = new Array();
    for(var round of data){
        var roundID = round.round_id;

        if(round.start_time != '-1'){
            for(var player of round.players){
                if(username == player.player_name){
                    startPuzzle(roundID, round.image, round.tileWidth, round.level, round.shape, round.edge, round.border);
                }
            }
            continue;
        }

        var roundCard = null;
        if(roundsIDList[roundID]){
            roundCard = $('#' + roundsIDList[roundID]);
        }
        else{
            var roundCardID = 'roundcard_' + roundID;
            roundsIDList[roundID] = roundCardID;
            var template = $('#roundcard_template');
            roundCard = $(template.html());
            roundCard.attr('id', roundCardID);
            roundCard.appendTo('#round_list');
        }
        roundsList[roundID] = round;

        var roundCardImage = roundCard.find('.roundcard-image');
        var roundCardTitle = roundCard.find('.roundcard-title');
        var roundCardNum = roundCard.find('.roundcard-num');
        var roundCardJoin = roundCard.find('.roundcard-join');

        if(admin=="true"){
            roundCardImage.attr('src', round.image);
        }else{
            roundCardImage.attr('src', '/images/logo.png');            
        }
        roundCardTitle.text('Round' + roundID);
        roundCardNum.text('level' + round.level + '    players: ' + round.players.length + '/' + round.players_num);
        roundCardJoin.click(function(){
            getRound(roundID);
        });
        for(var player of round.players){
            if(username == player.player_name && !roundDetailDialog.open){
                getRound(roundID);
            }
        }
    }

    var roundCardprefix = 'roundcard_';
    var newRoundsIDList = new Array();
    for(var roundCardID of roundsIDList){
        if(!roundCardID){
            continue;
        }
        var roundID = parseInt(roundCardID.substr(roundCardprefix.length));
        if(!roundsList[roundID]){
            var roundCard = $('#' + roundsIDList[roundID]);
            roundCard.remove();
        }
        else{
            newRoundsIDList[roundID] = roundCardID;
        }
    }
    roundsIDList = newRoundsIDList;

    if(roundDetailDialog.open){
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
    img.src = imgSrc;
    var tileWidth = 64;
	var param = {
		imageURL: imgSrc,
        level: level,
        edge: edge,
        shape: shape,
        border: border,
		players_num: playersNum,
        imageWidth: img.width,
        imageHeight: img.height,
        tileWidth: tileWidth,
        tilesPerRow:  Math.floor(img.width / tileWidth),
        tilesPerColunm: Math.floor(img.height / tileWidth)
	};

	$.ajax({
		data: param,
        url: requrl + 'round' + '/newRound',
        type: 'post',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function (data) {
        	console.log(data);
            var roundID = data.round_id;
            joinRound(roundID);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('error ' + textStatus + " " + errorThrown);
        }
    });
}


function quitRound(roundID){
    var round = roundsList[roundID];
    $.ajax({
        url: requrl + 'round' + '/quitRound/' + roundID,
        type: 'get',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function (data) {
            console.log(data);
            getJoinableRounds();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('error ' + textStatus + " " + errorThrown);
        }
    });
}

function joinRound(roundID){
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
            console.log(data);
            getJoinableRounds(roundID);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('error ' + textStatus + " " + errorThrown);
        }
    });
}

function startRound(roundID){
    $.ajax({
        url: requrl + 'round' + '/startRound/' + roundID,
        type: 'get',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function (data) {
            console.log(data);
            getJoinableRounds();
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('error ' + textStatus + " " + errorThrown);
        }
    });
}

function startPuzzle(roundID, imageURL, tileWidth, level, shape, edge, border){
    var imgSrc = imageURL;
    var thumbStr = '_thumb';
    var thumbIndex = imageURL.indexOf(thumbStr);
    if(thumbIndex >= 0){
        imgSrc = imageURL.substring(0, thumbIndex) + imageURL.substring(thumbIndex + thumbStr.length);
    }
    window.location.href = requrl + 'puzzle?level=' + level + '&roundID=' + roundID + '&image=' + imgSrc + '&tileWidth=' + tileWidth + '&shape=' + shape  + '&edge=' + edge + '&border=' + border ;
}

