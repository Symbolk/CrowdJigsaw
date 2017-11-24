var level = getUrlParams('level');
var shape = 'square';

var roundDetailDialog = $('#rounddetail_dialog').get(0);
if (!roundDetailDialog.showModal) {
    dialogPolyfill.registerDialog(roundDetailDialog);
}
var roundDetailJoinButton = $('#rounddetail_joinbutton');
var roundDetailCancelButton = $('#rounddetail_cancelbutton');
roundDetailCancelButton.click(function() {
    roundDetailDialog.close();
});


var newRoundDialog = $('#newround_dialog').get(0);
if (!newRoundDialog.showModal) {
    dialogPolyfill.registerDialog(newRoundDialog);
}
var newRoundCreateButton = $('#newround_createbutton');
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


$('#rounddisplay_join').click(function() {
	var roundID = $(this).attr('name');
    rounddetail_dialog.showModal();
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

var template = $('#roundcard_template');
var round = $(template.html());
round.attr('id', 'round_0');
round.appendTo('#round_list');

function renderRoundList(data){

}

function getRounds() {
    // var hintTileIndexes=new Array(-1,-1,-1,-1);
    $.ajax({
        url: requrl + 'round' + '/getJoinableRounds',
        type: 'get',
        dataType: 'json',
        cache: false,
        timeout: 5000,
        success: function (data) {
        	console.log(data);
            renderRoundList(data);
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('error ' + textStatus + " " + errorThrown);
        }
    });
}

function postNewRound() {
	var param = {
		level: level,

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
        },
        error: function (jqXHR, textStatus, errorThrown) {
            console.log('error ' + textStatus + " " + errorThrown);
        }
    });
}