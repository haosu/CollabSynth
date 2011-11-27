HOST = null; // localhost
PORT = 1337;

   
// when the daemon started
var starttime = (new Date()).getTime();

var fu = require("./fu"),
    sys = require("sys"),
    url = require("url"),
    qs = require("querystring"),
    $ = require("jquery");

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
			callbacks.shift().callback( id, [change] );
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

function listGroups() {
	var str = '';

	for(var i in groups) {
		str += i + ' ';
	}
} 

function joinGroup(groups, users, userId, groupId) {
	if(!groupId || groupId=='') {
		// assign to random group
		for(i in groups) {
			// should not be at max capacity
			groupId = i;
			break;
		}
	}
  
	// GET GROUP
	var group = groups[groupId];
	if(!groupId || !group) {
		groupId = Math.floor(Math.random()*99999999999).toString();
		group = new Group();
		group.id = groupId;
		group.init();
		groups[groupId] = group;
	}
 
	sys.puts('JOIN | Group is ' + groupId);
	/*
	sys.puts(this.groups);
	sys.puts(groups);
	sys.puts(groups[groupId].id);
	*/

	return group;
}

function leaveGroup(groups, users, userId) {
	
}

function getGroup(groups, id, option) {
	var retGroups = [];

	var group = groups[id];

	if(!group) {
		group =  createGroup(id);
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
		group = new Group();
		group.id = groupId;
		group.init();
		groups[groupId] = group;
	}

	return group;
};

 
 

var msg = "";
var users = {};
var groups = {};

fu.listen(Number(process.env.PORT || PORT), HOST);

fu.get("/", fu.staticHandler("index.html"));
fu.get("/style.css", fu.staticHandler("style.css"));
fu.get("/reset.css", fu.staticHandler("reset.css"));
fu.get("/client.js", fu.staticHandler("client.js"));
fu.get("/jquery-1.2.6.min.js", fu.staticHandler("jquery-1.2.6.min.js"));
fu.get("/raphael.js", fu.staticHandler("raphael.js"));
fu.get("/client-board.js", fu.staticHandler("client-board.js"));
fu.get("/backbone.js", fu.staticHandler("backbone.js"));
fu.get("/handlebars.js", fu.staticHandler("handlebars.js"));
fu.get("/underscore.js", fu.staticHandler("underscore.js"));
fu.get("/audio.js", fu.staticHandler("audio.js"));
fu.get("/jsfx.js", fu.staticHandler("jsfx.js"));
fu.get("/jsfxlib.js", fu.staticHandler("jsfxlib.js"));
fu.get("/pictos-web.eot", fu.staticHandler("pictos/pictos-web.eot"));
fu.get("/pictos-web.svg", fu.staticHandler("pictos/pictos-web.svg"));
fu.get("/pictos-web.ttf", fu.staticHandler("pictos/pictos-web.ttf"));
fu.get("/pictos-web.woff", fu.staticHandler("pictos/pictos-web.woff"));
fu.get("/pictos.css", fu.staticHandler("pictos/pictos.css"));
   
    
// send
fu.get("/send", function(req, res) {
	var userId = qs.parse(url.parse(req.url).query).userId;
	var space = qs.parse(url.parse(req.url).query).space;
	
	// if session !exists
	if(users[userId]==undefined) {
		res.simpleJSON(400, {responseText : "User not found. " + userId});
		return;
	}
	
	// fi nd group
	var groupId = users[userId].groupId;
	var change = new BoardChange(); 
 	
	change.space = space;
	change.timestamp = (new Date()).getTime();
	groups[groupId].update(change);
	
	res.simpleJSON(200, { });
});
  
// LOL THIS IS SO BAD! MAKE THESE FUNCTIONS MODULAR
// next, previous, or id
fu.get("/switchGroup", function(req, res){
	var groupId = qs.parse(url.parse(req.url).query).groupId;
	var userId = qs.parse(url.parse(req.url).query).userId;

 
	// leave group
	$.inArray(user.id, groups[userId].users);
	user.groupId = '';



	// check if group exists
	if(!groupId || groupId=='') {
		// assign to random group
		for(i in groups) {
			// should not be at max capacity
			groupId = i;
			break;
		}
	}

	// GET GROUP
	var group = groups[groupId];
	if(!groupId || !group) {
		groupId = Math.floor(Math.random()*99999999999).toString();
		group = new Group();
		group.id = groupId;
		group.init();
		groups[groupId] = group;
	}


	sys.puts('JOIN | Group is ' + groupId);


	// add to group
	var user = new User();
	user.id = userId;
	user.groupId = groupId;
	users[userId] = user;

	group.users.push(userId);

  


	res.simpleJSON(200, { userId : userId, 
											boardId : groupId,
											changes : group.exportBoard() 
										});
});

// data
fu.get("/data", function(req, res) {
	listGroups();


	var since = qs.parse(url.parse(req.url).query).since;
	var userId = qs.parse(url.parse(req.url).query).userId;

	if (!since) {
		res.simpleJSON(400, { responseText: "Must supply since parameter" });
		return;
	}

	
	// if session exists
	if(users[userId]==undefined) {
		res.simpleJSON(400, {responseText : "User not found."});
		return;
	}
	
	groups[users[userId].groupId].getUpdates(since, function(boardId, changes) {
			res.simpleJSON(200, 
				{ changes : changes,
					boardId : boardId
				});
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


	if(!groupId || groupId=='') {
		// assign to random group
		for(i in groups) {
			// should not be at max capacity
			groupId = i;
			break;
		}
	}
  
	sys.puts("JOIN | Trying to join " + groupId);

	// GET GROUP
	var group = groups[groupId];
	if(!group) {
		if(!groupId) {
			groupId = Math.floor(Math.random()*99999999999).toString();
		}
		group = new Group();
		group.id = groupId;
		group.init();
		groups[groupId] = group;
	}
  
	sys.puts('JOIN | Group is ' + groupId);
  
	// add to group
	var user = new User();
	user.id = userId;
	user.groupId = groupId;
	users[userId] = user;
 
	group.users.push(userId);
	  
	res.simpleJSON(200, { userId : userId, 
												boardId : groupId,
												changes : group.exportBoard() 
											});
});
   
// leave
fu.get("/leave", function(req, res) {
	var userId = qs.parse(url.parse(req.url).query).userId; 
	var groupId = qs.parse(url.parse(req.url).query).groupId;

	// if session exists
	if(users[userId]==undefined) {
		// remove session
		res.simpleJSON(400, {responseText : "User not found."});
		return;
	}

	// leave group
	$.inArray(user.id, groups[userId].users);
	user.groupId = '';

	// user should be reaped later

	res.simpleJSON(200, {});
});

 
 
