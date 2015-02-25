var ChatClient = angular.module('ChatClient', ['ngRoute', 'ngAnimate', 'toastr']);

ChatClient.config(
	function ($routeProvider) {
		$routeProvider
			.when('/login', { templateUrl: 'Views/login.html', controller: 'LoginController' })
			.when('/rooms/:user/', { templateUrl: 'Views/rooms.html', controller: 'RoomsController' })
			.when('/room/:user/:room/', { templateUrl: 'Views/room.html', controller: 'RoomController' })
			.otherwise({
	  			redirectTo: '/login'
			});
	}
);

ChatClient.controller('NavigationController', function ($scope, $location, $rootScope, $routeParams, socket) {
	$scope.disconnecting = function () {
		socket.emit('disconnect2', function () {

		});
		$location.path('/login');
	};
});

ChatClient.controller('LoginController', function ($scope, $location, $rootScope, $routeParams, socket) {
	
	$scope.errorMessage = '';
	$scope.nickname = '';

	$scope.login = function() {			
		if ($scope.nickname === '') {
			$scope.errorMessage = 'Please choose a nickname before continuing';
		} else {
			socket.emit('adduser', $scope.nickname, function (available) {
				if (available) {
					$location.path('/rooms/' + $scope.nickname);
				} else {
					$scope.errorMessage = 'This nickname is already taken!';
				}
			});			
		}
	};

});

ChatClient.controller('RoomsController', function ($scope, $location, $rootScope, $routeParams, socket) {
	$scope.rooms = [];
	$scope.currentUser = $routeParams.user;
	$scope.roomName = '';
	$scope.errorMessage = '';

	$scope.newRoom = function() {
		if ($scope.roomName === '') {
			$scope.errorMessage = 'Please name the room before continuing';
		} else {
			socket.emit('joinroom', { room:$scope.roomName }, function (success, reason) {
				if (success) {
					$location.path('/room/' + $scope.currentUser + '/' + $scope.roomName);
				} else {
					$scope.errorMessage = reason;
				}
			});
		}
	};

	var loadRooms = function() {
		socket.on('roomlist', function (data) {
			var rnames = Object.keys(data);
			$scope.rooms = rnames;
		});

		socket.emit('rooms', function () {
		});
	};

	loadRooms();
});

ChatClient.controller('RoomController', function ($scope, $location, $rootScope, $routeParams, socket, toastr) {
	$scope.currentRoom = $routeParams.room;
	$scope.currentUser = $routeParams.user;
	$scope.currentUsers = [];
	$scope.errorMessage = '';
	$scope.pmErrorMessage = '';
	$scope.successMessage = '';
	$scope.newMessage = '';
	$scope.messages = [];
	$scope.receiveName = '';
	$scope.privateMsg = '';
	$scope.receivedMsg = '';
	$scope.PMsender = '';
	$scope.pmHistory = [];
	$scope.currentPmHistory = [];
	$scope.currentOp = '';

	socket.on('updateusers', function (roomName, users, ops) {
		if(roomName === $scope.currentRoom) {
			$scope.currentUsers = users;
			console.log(ops[$scope.currentUser]);
			// Check if current user is an op so we can show op controls in the HTML
			if(ops[$scope.currentUser] !== undefined) {
				$scope.currentOp = $scope.currentUser;
			} else {
				$scope.currentOp = '';
			}
		}
	});		

	socket.emit('joinroom', { room: $scope.currentRoom }, function (success, reason) {
		if (!success) {
			if(reason === 'banned') {
				toastr.error('You have been banned from this room', 'Attention!');
			}
			// send user back to rooms
			$location.path('/rooms/' + $scope.currentUser);
		}
	});

	$scope.leaveRoom = function () {
		socket.emit('partroom', $scope.currentRoom);
        $location.path('/rooms/' + $scope.currentUser);
	};

	$scope.hidePMchat = function() {
		$scope.receiveName = '';
	};

	socket.on('updatechat', function (roomName, msgHistory) {
		if(roomName === $scope.currentRoom) {
			$scope.messages = msgHistory;

			setTimeout(scrollbottom(), 50);
		}
	});

	function scrollbottom() {
		var chatele = $(".scroll");

		var chatheight = chatele.prop("scrollHeight") + 1;
		$(chatele).scrollTop(chatheight);
	}

	function scrollbottomPM() {
		var chatele = $(".scrollPM");

		var chatheight = chatele.prop("scrollHeight");
		$(chatele).scrollTop(chatheight);
	}

	$scope.sendMessage = function () {
		if($scope.newMessage === '') {
			// Do nothing.
		} else {
			socket.emit('sendmsg', { roomName: $scope.currentRoom, msg: $scope.newMessage });
		}
		$scope.newMessage ='';
	};

	$scope.sendPM = function () {
		if($scope.privateMsg === '') {
			// Do nothing.
		}
		else {
			socket.emit('privatemsg', { nick: $scope.receiveName, message: $scope.privateMsg }, function (success) {
				if(success) {
					var pmObj = {
						sender : $scope.currentUser,
						message : $scope.privateMsg,
						receiver : $scope.receiveName
					};
					$scope.pmHistory.push(pmObj);
					showPM();					
				} else {
					$scope.pmErrorMessage = 'Failed to send PM';					
				}	
				$scope.privateMsg ='';	
				setTimeout(scrollbottomPM(), 50);
			});	
		}
	};

	$scope.pmToUser = function(user) {
		if($scope.currentUser !== user) {
			$scope.receiveName = user;
			$scope.currentPmHistory = [];

			for(var i = 0; i < $scope.pmHistory.length; i++) {
				if(($scope.currentUser === $scope.pmHistory[i].sender && $scope.receiveName === $scope.pmHistory[i].receiver) || 
					($scope.currentUser === $scope.pmHistory[i].receiver && $scope.receiveName === $scope.pmHistory[i].sender)) {
					$scope.currentPmHistory.push($scope.pmHistory[i]);
				}
			}
		}
	};

	var showPM = function() {
		$scope.currentPmHistory = [];
		for(var i = 0; i < $scope.pmHistory.length; i++) {
			if(($scope.currentUser === $scope.pmHistory[i].sender && $scope.receiveName === $scope.pmHistory[i].receiver) || 
				($scope.currentUser === $scope.pmHistory[i].receiver && $scope.receiveName === $scope.pmHistory[i].sender)) {
				$scope.currentPmHistory.push($scope.pmHistory[i]);
			}
		}
	};

	socket.on('recv_privatemsg', function(username, message) {
		var pmObj = {
				sender : username,
				message : message,
				receiver : $scope.currentUser
		};
		$scope.pmHistory.push(pmObj);
		if($scope.receiveName === '') {
			$scope.PMsender = username;
		}
		showPM();
		setTimeout(scrollbottomPM(), 50);
	});

	$scope.pmReceived = function (PMsender) {
		$scope.pmToUser(PMsender);
		$scope.PMsender = '';
	};

	$scope.kickUser = function (user) {
		socket.emit('kick', { room: $scope.currentRoom , user: user }, function (success) {
		});
		if($scope.receiveName === user) {
			$scope.receiveName = '';
		}
	};

	socket.on('kicked', function(room, user, username) {
		if($scope.currentUser === user && $scope.currentRoom === room) {
			$location.path('/rooms/' + $scope.currentUser);
			toastr.warning('You were kicked from the room', 'Attention!');
		}
		if($scope.currentUser === username) {
			var message = 'kicked ' + user + ' from the room.';
			socket.emit('sendmsg', { roomName: room, msg: message });
		}
	});

	$scope.banUser = function (user) {
		if($scope.receiveName === user) {
			$scope.receiveName = '';
		}
		
		socket.emit('ban', { room: $scope.currentRoom , user: user }, function (success) {
		});
	};

	socket.on('banned', function(room, user, username) {
		if($scope.currentUser === user && $scope.currentRoom === room) {
			$location.path('/rooms/' + $scope.currentUser);
			toastr.error('You\'ve been banned from the room', 'Attention!');
		}
		if($scope.currentUser === username) {
			var message = 'banned ' + user + ' from the room.';
			socket.emit('sendmsg', { roomName: room, msg: message });
		}
	});

	$scope.op = function (user) {
		socket.emit('op', { room: $scope.currentRoom , user: user }, function (success) {
		});
	};

	socket.on('opped', function(room, user, username) {
		if($scope.currentUser === username) {
			var message = 'promoted ' + user + ' to op of ' + room + '.';
			socket.emit('sendmsg', { roomName: room, msg: message });
		}
	});

	$scope.deop = function (user) {
		console.log("YOLO");
		socket.emit('deop', { room: $scope.currentRoom , user: user }, function (success) {
			if(success) {
				console.log("virkar");
			} else {
				console.log("ekki");
			}
		});
	};

	socket.on('deopped', function(room, user, username) {
		console.log("NOLO");
		if($scope.currentUser === username) {
			var message = 'demoted ' + user + ' from being op of ' + room + '.';
			socket.emit('sendmsg', { roomName: room, msg: message });
		}
	});

	$scope.$on('$destroy', function () {
		socket.getSocket().removeAllListeners();
	});

	$scope.formatTimestamp = function (ts) {
		return moment(ts).format('HH:mm');
	};
});

ChatClient.filter('removeCurrentUser', function ($routeParams) {
	var user = $routeParams.user;
	return function (items) {
		var filtered = [];
		for(var i in items) {
			if(i !== user) {
				filtered.push(i);
			}
		}
		return filtered;
	};
});