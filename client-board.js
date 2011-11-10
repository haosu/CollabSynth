
function MusicBoard() {
	var RADIUS_SMALL = 20;
	var RADIUS_MEDIUM = 25;
	var RADIUS_LARGE = 30;
	var COLOR = "#666";
	var COLOR_OVER = "#CCC";
	var COLOR_ACTIVE = "#FF0";
	
	var height = 8;
	var width = 16;
	var paper;
	var currentColumn;
	var verticalSets = [];

	var boardId;
	var userId;
	var since = 0;

	var template;
	var container;
	
	this.init = function(boardId) {
		_.bindAll(this)

		this.currentColumn = -1;
		this.verticalSets = new Array();

		this.template = Handlebars.compile(
											$("#board-template").html()
										);

    this.container = $("<div class='board_inner'>").html(this.template());

    this.boardId = boardId;
    this.since = 0;
	};
	
	this.draw = function() {
		var boardDiv = this.container.find(".board")[0];
		this.paper = Raphael(boardDiv, width*(RADIUS_SMALL+RADIUS_LARGE)+(RADIUS_SMALL+1)+10, height*(RADIUS_SMALL+RADIUS_LARGE)+(RADIUS_SMALL+1)+10);
		
		for(var i=0; i<width; i++) {
			this.verticalSets[i] = this.paper.set();
			
			for(var j=0; j<height; j++) {
				var circle = this.paper.circle(i*(RADIUS_SMALL+RADIUS_LARGE)+(RADIUS_SMALL+1)+10, j*(RADIUS_SMALL+RADIUS_LARGE)+(RADIUS_SMALL+1)+10, RADIUS_SMALL)
									.attr({"stroke":COLOR, "fill":COLOR});
				
				(function(context, circle, space){
					circle.click(function(){context.sendChange(space)});
				})(this, circle, i+","+j);
									
				circle.hover(
					function(){
						this.animate({"r":RADIUS_LARGE}, 250, ">");
					},
					function(){
						this.animate({"r":RADIUS_SMALL}, 250, ">");					
					});

				this.verticalSets[i].push(circle);
			}
			
			
		}
		
	};
	
	this.toggle = function(space) {
		var coords = space.split(',');
		var x = parseInt(coords[0]);
		var y = parseInt(coords[1]);

		if(this.verticalSets[x][y].attr("fill")==COLOR_ACTIVE) {
			this.verticalSets[x][y]
				.animate({"stroke":COLOR, "fill":COLOR}, 250, ">");
		}
		else {
			this.verticalSets[x][y]
				.animate({"stroke":COLOR_ACTIVE, "fill":COLOR_ACTIVE}, 250, ">");
		}
		
	};
	
	this.populateBoard = function(changes) {
		var change;
		for(var i in changes) {
			change = changes[i].space || changes[i];
			musicBoard.toggle(change);
		}
	};
	
	this.play = function() {
		var previousColumn = this.currentColumn;
		this.currentColumn = (this.currentColumn + 1) % width;

		this.verticalSets[this.currentColumn].animate({"r":RADIUS_MEDIUM}, 50, ">");		
		this.verticalSets[previousColumn].animate({"r":RADIUS_SMALL}, 50, ">");		
		
		/*
		obj.verticalSets[obj.currentColumn].animate({"stroke":COLOR_OVER, "fill":COLOR_OVER}, 50, ">");		
		obj.verticalSets[previousColumn].animate({"stroke":COLOR, "fill":COLOR}, 50, ">");		
		*/
	};

	this.join = function() {
		$.ajax({
			cache : false,
			type : "GET",
			dataType : "json",
			url : "/join",
			data : {groupId : this.boardId},
			error : this.onJoinError,
			success : this.onJoinSuccess
		});
	};

	this.update = function() {
		//this.since =123;
		$.ajax({
			cache : false,
			type : "GET",
			url : "/data", 
			dataType : "json",
			data : {userId : this.userId, since : this.since },
			error : this.onUpdateError,
			success : this.onUpdateSuccess
		});
	};

	this.sendChange = function(space) {
		$.ajax({
			cache : false,
			type : "GET",
			url: "/send",
			dataType: "json",
			data: {userId : this.userId, space : space},
			error: function(data) {
				console.log(data.responseText);
			},
			success: function(data) {
				
			}
		});
	};

	this.leave = function() {
		$.ajax({
			cache : false,
			type : "GET",
			url : "/leave", 
			dataType : "json",
			data : {userId : this.userId, groupId : this.boardId},
			success : function() {
				
			}
		});
	},

	this.onJoinSuccess = function(data) {
		this.userId = data.userId;
		this.boardId = data.boardId;
		this.populateBoard(data.changes);

		this.container.find(".board_id").html(data.boardId);

		setInterval(
			this.play, 
			250
		);

		this.update();
	};

	this.onJoinError = function(data) {
		console.log('error');
	};

	this.onUpdateSuccess = function(data) {
		this.since = (new Date()).getTime()
		transmission_errors = 0;

		this.populateBoard(data.changes);

		this.update();
	};

	this.onUpdateError = function(data) {
		console.log(data);
		//transmission_errors += 1;
		//don't flood the servers on error, wait 10 seconds before retrying
		setTimeout(this.update, 10*1000);
	};
};