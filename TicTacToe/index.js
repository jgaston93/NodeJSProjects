var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var uuid = require('uuid');
var players = [];
var numusers = 0;
var board = [0,0,0,0,0,0,0,0,0];

function checkboard() {
	if(board[0] != 0 && board[0] == board[1] && board[1] == board[2]) {
		return 'win';
	}
	if(board[3] != 0 && board[3] == board[4] && board[4] == board[5]) {
		return 'win';
	}
	if(board[6] != 0 && board[6] == board[7] && board[7] == board[8]) {
		return 'win';
	}
	if(board[0] != 0 && board[0] == board[3] && board[3] == board[6]) {
		return 'win';
	}
	if(board[1] != 0 && board[1] == board[4] && board[4] == board[7]) {
		return 'win';
	}
	if(board[2] != 0 && board[2] == board[5] && board[5] == board[8]) {
		return 'win';
	}
	if(board[0] != 0 && board[0] == board[4] && board[4] == board[8]) {
		return 'win';
	}
	if(board[2] != 0 && board[2] == board[4] && board[4] == board[6]) {
		return 'win';
	}
	var draw = true;
	for(var i = 0; i < board.length; i++) {
		if(board[i] == 0) {
			draw = false;
			break;
		}
	}
	if(draw) {
		return 'draw';
	}
	return 'unfinished';
};


app.get('/', function(req, res) {
	res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket){
	var id = 0;
	if(numusers < 2) {
		id = uuid();
		players.push({id : id, my_turn : false});
		numusers++;
		socket.on('submit move', function(move){
			if(board[move.box] == 0 && numusers == 2) {
				var previous_user = 0;
				if(players[0].id == move.user && players[0].my_turn) {
					previous_user = players[0].id;
					board[move.box] = previous_user;
					io.emit('move response', {board: board, id: previous_user});
					players[0].my_turn = false;
					players[1].my_turn = true;
					var status = checkboard();
					if(status == 'win') {
						players[1].my_turn = false;
						io.emit('game over', {id: previous_user});
					}else if(status == 'draw') {
						io.emit('game over', {id: 0});
					}
				}else if(players[1].id == move.user && players[1].my_turn) {
					previous_user = players[1].id;
					board[move.box] = previous_user;
					io.emit('move response', {board: board, id: previous_user});
					players[1].my_turn = false;
					players[0].my_turn = true;
					var status = checkboard();
					if(status == 'win') {
						players[0].my_turn = false;
						io.emit('game over', {id: previous_user});
					}else if(status == 'draw') {
						io.emit('game over', {id: 0});
					}
				}
			}
		});
		socket.on('disconnect',function() {
			numusers = 0;
			players = [];
			board = [0,0,0,0,0,0,0,0,0];
			io.emit('reset');
		});
		
		socket.emit('join response', {id: id, success: true});
		
		if(numusers == 2) {
			var starter_id = 0;
			if(Math.random() >= .5) {
				players[0].my_turn = true;
				starter_id = players[0].id;
			}else {
				players[1].my_turn = true;
				starter_id = players[1].id;
			}
			io.emit('start game', {id: starter_id});
		}
	}else {
		socket.emit('join response', {id: id, success: false});
	}
});

http.listen(3001, '0.0.0.0', function() {
	console.log('listening on *:3001');
});
