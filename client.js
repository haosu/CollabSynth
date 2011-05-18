var musicBoard;
var USERID = '';
var SINCE = 0;

$().ready(function(){
	musicBoard = new MusicBoard();
	musicBoard.init();
	musicBoard.draw();
	setInterval(function(){musicBoard.play(musicBoard)}, 250);
	
	join();
});

function join() {
	$.ajax({
		cache : false,
		type : "GET",
		dataType : "json",
		url : "/join",
		data : {},
		error : function () {
			console.log('error');
		},
		success : function(data) {
			USERID = data.userId;
			musicBoard.populateBoard(data.board);
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

			for(var i in data.changes) {
				musicBoard.toggle(data.changes[i].space);
			}
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