var users = [];
var stat = {};

exports = module.exports = function(io) {
	io.on('connection', function(socket) {
		
		socket.on('login', function(userName) {
	        if (users.indexOf(userName) > -1) {
	            socket.emit('userExist');
	        } else {
	        	socket.userName = userName;
	            users.push(userName);
	            socket.emit('loginSuccess', userName);
	        };
	    });

		socket.on('createSession', function(room, testMod) {
			socket.join(room);
			socket.emit('createSuccess', room);
			socket.ready = false;
			socket.test = testMod;
		})
		
		socket.on('joinSession', function(room, user) {
			var roomID = io.sockets.adapter.rooms[room];
			var tmod = false;
			if (roomID == undefined) {
				socket.emit('roomNotExist');
			} else {
				socket.join(room);

				var clientNum = io.sockets.adapter.rooms[room].length;
				if (clientNum > 2){
					socket.watch = true;
					socket.ready = true;
					socket.emit('watchMod', room);
				} else {
					for (socketID in io.nsps['/'].adapter.rooms[room].sockets) {
						var testMod = io.nsps['/'].connected[socketID].test;
						tmod = tmod || testMod;
					}

					io.sockets.in(room).emit('battleStart', room, user, tmod);
					socket.ready = false;
				}
			}
			
		})

		socket.on('newShogun', function(shogun, id, room, user, tShogun) {
			io.sockets.in(room).emit('shogunAdd', shogun, id, user, tShogun);
		})

		socket.on('removeShogun', function(id, room, user) {
			io.sockets.in(room).emit('shogunRemove', id, user);
		})

		socket.on('endTurn', function(room) {
			socket.ready = true;
			var allDone = true;
			for (socketID in io.nsps['/'].adapter.rooms[room].sockets) {
				var Stat = io.nsps['/'].connected[socketID].ready;
				allDone = allDone && Stat;
			}

			if (allDone) {
				io.sockets.in(room).emit('endThisTurn');
			}
		})

		socket.on('prepared', function(room) {
			socket.ready = true;
			var allDone = true;
			for (socketID in io.nsps['/'].adapter.rooms[room].sockets) {
				var Stat = io.nsps['/'].connected[socketID].ready;
				allDone = allDone && Stat;
			}

			if (allDone) {
				io.sockets.in(room).emit('startNextTurn');
			}
		})

		socket.on('notDone', function() {
			socket.ready = false;
		})

		socket.on('cleanAll', function(room, msg) {
			io.sockets.in(room).emit('cleanBegin', socket.userName, msg);
		})

		socket.on('disconnect', function(room) {
			if (socket.userName != null) {
				socket.leave(room);
				users.splice(users.indexOf(socket.userName), 1);
	        }
		})

		socket.on('sendMessage', function(msg, room) {
			io.sockets.in(room).emit('newMessage', socket.userName,msg);
		});
	});
}