
var musicBoard;
var audioUrls = [];

$().ready(function(){

	$("#join_button").click(function(){
	boardId = $("#signin_box input").val();
	init(boardId);
		//join(boardId);
		//$("#signInBox").remove();
	});

});


function init(boardId) {
	musicBoard = new MusicBoard();
	musicBoard.init(boardId);
	musicBoard.join()
	$(".board_container").append(musicBoard.container);
	musicBoard.draw();

}

function loadAudio() {
	for(var i in audioUrls) {
		//audioUrls[i];
		//create new audio element with audioUrls[i] as source
		//set id as audio-i
		
	}
}
