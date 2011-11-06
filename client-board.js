
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

	var template;
	var container;
	
	this.init = function() {
		this.currentColumn = -1;
		this.verticalSets = new Array();

		this.template = Handlebars.compile(
											$("#board-template").html()
										);

    this.container = $("<div class='board_container inner'>").html(this.template());
	};
	
	this.draw = function() {
		var boardDiv = this.container.find(".board")[0];
		this.paper = Raphael(boardDiv, width*(RADIUS_SMALL+RADIUS_LARGE)+(RADIUS_SMALL+1)+5, height*(RADIUS_SMALL+RADIUS_LARGE)+(RADIUS_SMALL+1)+5);
		
		for(var i=0; i<width; i++) {
			this.verticalSets[i] = this.paper.set();
			
			for(var j=0; j<height; j++) {
				var circle = this.paper.circle(i*(RADIUS_SMALL+RADIUS_LARGE)+(RADIUS_SMALL+1)+5, j*(RADIUS_SMALL+RADIUS_LARGE)+(RADIUS_SMALL+1)+5, RADIUS_SMALL)
									.attr({"stroke":COLOR, "fill":COLOR});
				
				(function(circle, space){
					circle.click(function(){changeBoard(space)});
				})(circle, i+","+j);
									
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
	
	this.play = function(obj) {
		var previousColumn = obj.currentColumn;
		obj.currentColumn = (obj.currentColumn + 1) % width;

		obj.verticalSets[obj.currentColumn].animate({"r":RADIUS_MEDIUM}, 50, ">");		
		obj.verticalSets[previousColumn].animate({"r":RADIUS_SMALL}, 50, ">");		
		
		/*
		obj.verticalSets[obj.currentColumn].animate({"stroke":COLOR_OVER, "fill":COLOR_OVER}, 50, ">");		
		obj.verticalSets[previousColumn].animate({"stroke":COLOR, "fill":COLOR}, 50, ">");		
		*/
	};

	this.update = function() {
		$.ajax({
			cache : false,
			type : "GET",
			url : "/data", 
			dataType : "json",
			data : {userId : userId, since : SINCE},
			error : this.onUpdateError,
			success : this.onUpdateSuccess
		});
	};

	this.leave = function() {
		$.ajax({
			cache : false,
			type : "GET",
			url : "/leave", 
			dataType : "json",
			data : {userId : userId, groupId : boardId},
			success : function() {
				
			}
		});
	},

	this.onUpdateSuccess = function(data) {
		SINCE = (new Date()).getTime()
		transmission_errors = 0;

		this.populateBoard(data.changes);

		this.update();
	};

	this.onUpdateError = function(data) {
		console.log(data);
		//transmission_errors += 1;
		//don't flood the servers on error, wait 10 seconds before retrying
		setTimeout(update, 10*1000);
	};
};