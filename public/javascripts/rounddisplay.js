var roundsList = new Array();

var roundDetailDialog = $('#rounddetail_dialog').get(0);
if (!roundDetailDialog.showModal) {
    dialogPolyfill.registerDialog(roundDetailDialog);
}
var roundDetailJoinButton = $('#rounddetail_joinbutton');
roundDetailJoinButton.click(function() {
    var roundID = $('#rounddetail_id').text();
    if(roundDetailJoinButton.text() == 'Join'){
        joinRound(roundID);
    }
    else{
        getRound(roundID);
    }
});
var roundDetailCancelButton = $('#rounddetail_cancelbutton');
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


var newRoundDialog = $('#newround_dialog').get(0);
if (!newRoundDialog.showModal) {
    dialogPolyfill.registerDialog(newRoundDialog);
}
var newRoundCreateButton = $('#newround_createbutton');
newRoundCreateButton.click(function() {
	var imgSrc = $('#newround_image').attr('src');
    var level = $('#newround_level').val();
	var playersNum = $('#newround_number').val();
    var shape = 'jagged';
    if(level == 2){
        shape = 'square';
    }
    postNewRound(imgSrc, level, playersNum, shape);
    getJoinableRounds();
    newRoundDialog.close();
});
var newRoundCancelButton = $('#newround_cancelbutton');
newRoundCancelButton.click(function() {
    newRoundDialog.close();
});

var selectImageDialog = $('#selectimage_dialog').get(0);
if (!selectImageDialog.showModal) {
    dialogPolyfill.registerDialog(selectImageDialog);
}

var showImageDialog = $('#showimage_dialog').get(0);
if (!showImageDialog.showModal) {
    dialogPolyfill.registerDialog(showImageDialog);
}
var showImageCancelButton = $('#showimage_cancelbutton');
showImageCancelButton.click(function() {
    showImageDialog.close();
});


$('#newround_image').click(function() {
	selectImageDialog.showModal();
});

$('.selector-image').click(function(){
	var imgSrc = $(this).attr('src');
	$('#newround_image').attr('src', imgSrc);
	selectImageDialog.close();
});

$('#rounddetail_preview').click(function(){
	var imgSrc = $('#rounddetail_image').attr('src');
	$('#showimage_image').attr('src', imgSrc);
	showImageDialog.showModal();
});

$('#newround_preview').click(function(){
	var imgSrc = $('#newround_image').attr('src');
	$('#showimage_image').attr('src', imgSrc);
	showImageDialog.showModal();
});

$('#newround_button').click(function(){
	newRoundDialog.showModal();
});
/*
var template = $('#roundcard_template');
var round = $(template.html());
round.attr('id', 'round_0');
round.appendTo('#round_list');
*/

var getJoinableRoundsInterval = setInterval(getJoinableRounds, 1000);
getJoinableRounds();


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
    var roundDetailShape = $('#rounddetail_shape');
    var roundDetailProgress = document.querySelector('#rounddetail_progress');

    var roundDetailLevel = $('#rounddetail_level');

    roundDetailImage.attr('src', round.image);
    roundDetailID.text(round.round_id);
    roundDetailCreator.text(round.creator);
    roundDetailCreateTime.text(round.create_time);
    roundDetailShape.text(round.shape);

    roundDetailProgress.MaterialProgress.setProgress(100*round.players.length/round.players_num);

    roundDetailLevel.text('Level' + round.level);
    
    var roundDetailPlayerList = $('#rounddetail_playerlist');
    roundDetailPlayerList.empty();
    roundDetailJoinButton.text('Join');
    roundDetailCancelButton.text('Close');
    for(var player of round.players){
        var li = $($('#rounddetail_li_template').html());
        li.find('.player-name').text(player.player_name);
        li.find('.join-time').text(player.join_time);
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
    $('#round_list').empty();
    for(var round of data){
        var roundID = round.round_id;
        var roundCardID = 'roundcard_' + roundID;
        var roundCardJoinID = 'roundcard_join_' + roundID;

        if(round.start_time != '-1'){
            for(var player of round.players){
                if(username == player.player_name){
                    startPuzzle(round.level, roundID, round.image);
                }
            }
            continue;
        }

        var template = $('#roundcard_template');
        var roundCard = $(template.html());
        roundCard.attr('id', roundCardID);
        roundCard.appendTo('#round_list');
        roundsList[roundID] = round;

        var roundCardImage = roundCard.find('.roundcard-image');
        var roundCardTitle = roundCard.find('.roundcard-title');
        var roundCardNum = roundCard.find('.roundcard-num');
        var roundCardJoin = roundCard.find('.roundcard-join');

        roundCardImage.attr('src', round.image);
        roundCardTitle.text('Round' + roundID);
        roundCardNum.text('level' + round.level + '    players: ' + round.players.length + '/' + round.players_num);
        roundCardJoin.attr('id', roundCardJoinID);
        roundCardJoin.click(function(){
            getRound(roundID);
        });
        for(var player of round.players){
            if(username == player.player_name){
                getRound(roundID);
            }
        }
    }
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

function postNewRound(imgSrc, level, playersNum, shape) {
	var param = {
		level: level,
		shape: shape,
		imageURL: imgSrc,
		players_num: playersNum
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

function startPuzzle(level, roundID, imageURL){
    window.location.href = requrl + 'puzzle?level=' + level + '&roundID=' + roundID + '&image=' + imageURL;
}