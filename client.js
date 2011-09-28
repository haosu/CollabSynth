
var musicBoard;
var USERID = '';
var SINCE = 0;

var audioUrls = [];

$().ready(function(){
		
	$("#joinButton").click(function(){
		boardId = $("#signInBox input").val();
		init(boardId);
		join(boardId);
		$("#signInBox").remove();
	});
	
});


function init() {
	musicBoard = new MusicBoard();
	musicBoard.init();
	musicBoard.draw();
}

function loadAudio() {
	for(var i in audioUrls) {
		//audioUrls[i];
		//create new audio element with audioUrls[i] as source
		//set id as audio-i
		
	}
}

function join(boardId) {
	$.ajax({
		cache : false,
		type : "GET",
		dataType : "json",
		url : "/join" + "?groupId=" + boardId,
		data : {},
		error : function () {
			console.log('error');
		},
		success : function(data) {
			USERID = data.userId;
			musicBoard.populateBoard(data.changes);

			setInterval(function(){musicBoard.play(musicBoard)}, 250);

			update();
		}
	});
};

function update() {
	$.ajax({
		cache : false,
		type : "GET",
		url : "/data", 
		dataType : "json",
		data : {userId : USERID, since : SINCE},
		error : function(data) {
			console.log(data.responseText);
			//transmission_errors += 1;
			//don't flood the servers on error, wait 10 seconds before retrying
			setTimeout(update, 10*1000);
		},
		success : function(data) {
			SINCE = (new Date()).getTime()
			transmission_errors = 0;

			musicBoard.populateBoard(data.changes);

			update();
		}
	});
};

function changeBoard(space) {
	$.ajax({
		cache : false,
		type : "GET",
		url: "/send",
		dataType: "json",
		data: {userId : USERID, space : space},
		error: function(data) {
			console.log(data.responseText);
		},
		success: function(data) {
			
		}
	});
};