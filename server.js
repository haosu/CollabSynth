HOST = null; // localhost
PORT = 1337;

// when the daemon started
var starttime = (new Date()).getTime();


var fu = require("./fu"),
    sys = require("sys"),
    url = require("url"),
    qs = require("querystring");

function BoardChange() {
	var space = '';
	var timestamp = '';
};

function Group() {
	var id = '';
	var users = [];
	var changes = [];
	var callbacks = [];
	var board = {};
	
	this.init = function() {
		this.users = new Array();
		this.changes = new Array();
		this.callbacks = new Array();
		this.board = {};
	}
	
	this.getUpdates = function(since, callback) {
		var sinceLast = [];
		for (var i=0; i<changes.length; i++) {
			var change = changes[i];
			if(change.timestamp > since) {
				sinceLast.push(change);
			}
		}
		
		if(sinceLast.length != 0) {
			callback(sinceLast);
		}
		else {
			callbacks.push({ timestamp : new Date(), callback : callback });
		}
	};
	
	// adds change to changes queue, and pops all of the callbacks
	// this sends each individual change as it's own response
	// should add to a queue
	this.update = function(change) {
		changes.push(change);
		board[change.space] = !board[change.space];

		while(callbacks.length > 0) {
			callbacks.shift().callback([change]);
		}
		
		while(changes.length > 0) {
			changes.shift();
		}
	};
	
	this.exportBoard = function() {
		var change = new Array();
		for(var i in board) {
			if(board[i] == true) {
				change.push(i);
			}
		}
		
		return change;
	};
	
	this.destroy = function() {
		if(users.length < 1) {
			delete groups[id];
		}
	};
};

function User() {
	var id = '';
	var groupId = '';
	
	this.destroy = function(){
		// remove from group
		delete users[id];
	};
};


function getGroup(id, option) {
	var retGroups = [];

	var group = groups[id];

	if(!group) {
		group = createGroup(id);
	}
	
	retGroups.push(group);


	return retGroups;


	/*
	// search until current is found
	// store previous and next
	var groupKeyArr = Object.getKeys(groups);
	var groupKeyArrLength = groupKeyArr.length;

	var previousId, nextId;


	for(var i=0; i<groupKeyArrLength; i++) {
		if(groupKeyArr == id) {
			previousId = groupKeyArr[(i-1) % groupKeyArrLength];
			nextId = groupKeyArr[(i+1) % groupKeyArrLength];
			break;
		}
	}

	switch(option) {
		// get previous
		case -1 :
			return [groups[previousId], groups[id]];
		break;

		// current
		case 0 : 
			return groups[id];
		break;

		// get next
		case 1 :
			return [groups[id], groups[nextId]];
		break;

		// previous and next
		case 2 :
			return [groups[previousId], groups[id], groups[nextId]];
		break;

		default :
		break;
	}
	*/
}



var createGroup = function(groupId) {
	if(groupId==undefined || groups[groupId]==undefined) {
		groupId = Math.floor(Math.random()*99999999999).toString();
		groups[groupId] = new Group();
		groups[groupId].init();
		groups[groupId].id = groupId;
	}

	return groups[groupId];
};


var msg = "";
var users = {};
var groups = {};


fu.listen(Number(process.env.PORT || PORT), HOST);

fu.get("/", fu.staticHandler("index.html"));
fu.get("/style.css", fu.staticHandler("style.css"));
fu.get("/client.js", fu.staticHandler("client.js"));
fu.get("/jquery-1.2.6.min.js", fu.staticHandler("jquery-1.2.6.min.js"));
fu.get("/raphael.js", fu.staticHandler("raphael.js"));
fu.get("/client-board.js", fu.staticHandler("board.js"));
fu.get("/backbone.js", fu.staticHandler("backbone.js"));


// send
fu.get("/send", function(req, res) {
	var userId = qs.parse(url.parse(req.url).query).userId;
	var space = qs.parse(url.parse(req.url).query).space;
	
	// if session !exists
	if(users[userId]==undefined) {
		res.simpleJSON(400, {error : "User not found. " + userId});
		return;
	}
	
	// find group
	var groupId = users[userId].groupId;
	var change = new BoardChange();
	
	change.space = space;
	change.timestamp = (new Date()).getTime();
	groups[groupId].update(change);
	
	res.simpleJSON(200, { });
});


fu.get("/switch", function(req, res){
	var groupId = qs.parse(url.parse(req.url).query).groupId;
	var userId = qs.parse(url.parse(req.url).query).userId;

	// check if group exists
	var group = getGroup(groupId);


	users[userId].groupId = groupId;

});

// data
fu.get("/data", function(req, res) {
	var since = qs.parse(url.parse(req.url).query).since;
	var userId = qs.parse(url.parse(req.url).query).userId;

	if (!since) {
		res.simpleJSON(400, { error: "Must supply since parameter" });
		return;
	}

	
	// if session exists
	if(users[userId]==undefined) {
		res.simpleJSON(400, {error : "User not found."});
		return;
	}
	
	groups[users[userId].groupId].getUpdates(since, function(changes) {
			res.simpleJSON(200, { changes : changes });
		});
	
});


// join
fu.get("/join", function(req, res) {
	// assign userId
	// get random group, +/- 1 groups
	// assign group
	// return 
	userId = Math.floor(Math.random()*99999999999).toString();
	var groupId = qs.parse(url.parse(req.url).query).groupId;

	if(groupId==undefined) {
		// assign to random group
		for(i in groups) {
			// should not be at max capacity
			groupId = i;
			break;
		}

		sys.puts('JOIN | Group reassigned to ' + groupId);
	}
	
	// GET GROUP
	var group = getGroup(groupId);
	
	// add to group
	var user = new User();
	user.id = userId;
	user.groupId = groupId;
	users[userId] = user;

	group.users.push(userId);
	
	res.simpleJSON(200, { userId : userId, 
												changes: group.exportBoard() 
											});
});

// leave
fu.get("/leave", function(req, res) {
	var userId = qs.parse(url.parse(req.url).query).userId;
	
	// if session exists
	if(users[userId]==undefined) {
		// remove session
		res.simpleJSON(400, {error : "User not found."});
		return;
	}

	var user = users[userId];
	groups[user.groupId].destroy();
	user.destroy();

	res.simpleJSON(200, {});
});




