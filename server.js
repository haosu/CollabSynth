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
		delete users[id];
	};
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
fu.get("/board.js", fu.staticHandler("board.js"));


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

// data
fu.get("/data", function(req, res) {
	var since = qs.parse(url.parse(req.url).query).since;
	
	if (!since) {
		res.simpleJSON(400, { error: "Must supply since parameter" });
		return;
	}
	
	var userId = qs.parse(url.parse(req.url).query).userId;
	
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
	userId = Math.floor(Math.random()*99999999999).toString();
	var groupId = qs.parse(url.parse(req.url).query).groupId;

	if(groupId==undefined) {
		// assign to random group
		for(i in groups) {
			groupId = i;
			break;
		}
	}
	
	if(groupId==undefined || groups[groupId]==undefined) {
		groupId = Math.floor(Math.random()*99999999999).toString();
		groups[groupId] = new Group();
		groups[groupId].init();
		groups[groupId].id = groupId;
	}
	
	
	// add to group
	var user = new User();
	user.id = userId;
	user.groupId = groupId;
	users[userId] = user;
	
	sys.puts(groupId);
	sys.puts(groups[groupId].users);
	groups[groupId].users.push(userId);
	
	res.simpleJSON(200, { userId : userId, changes:groups[groupId].exportBoard() });
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




