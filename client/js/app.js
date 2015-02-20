var ChatClient = angular.module('ChatClient', ['ngRoute']);

ChatClient.config(
	function ($routeProvider) {
		$routeProvider
			.when('/', { templateUrl: 'Views/navigation.html', controller: 'NavigationController'})
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
		//console.log("hallo");
		$location.path('/login');

	}
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
	}

	loadRooms = function() {
		socket.on('roomlist', function (data) {
			var rnames = Object.keys(data);
			$scope.rooms = rnames;
		});

		socket.emit('rooms', function () {
		});
	}

	loadRooms();
});

ChatClient.controller('RoomController', function ($scope, $location, $rootScope, $routeParams, socket) {
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

	socket.on('updateusers', function (roomName, users, ops) {
		if(roomName === $scope.currentRoom) {
			$scope.currentUsers = users;
		}
	});		

	socket.emit('joinroom', { room: $scope.currentRoom }, function (success, reason) {
		if (!success) {
			$scope.errorMessage = reason;
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
	}

	socket.on('updatechat', function (roomName, msgHistory) {
		$scope.messages = msgHistory;
	});

	$scope.sendMessage = function () {
		if($scope.newMessage === '') {
			//$scope.errorMessage = 'You must write something';
		} else {
			socket.emit('sendmsg', { roomName: $scope.currentRoom, msg: $scope.newMessage });
		}
	};

	$scope.sendPM = function () {
		if($scope.privateMsg === '') {
			//$scope.errorMessage = 'Message can not be blank';
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
			});	
		}
	};

	$scope.pmToUser = function(user) {
		if($scope.currentUser !== user){
			$scope.receiveName = user;
			$scope.currentPmHistory = [];
			for(var i = 0; i < $scope.pmHistory.length; i++)
			{
				if(($scope.currentUser === $scope.pmHistory[i].sender && $scope.receiveName === $scope.pmHistory[i].receiver) || 
					($scope.currentUser === $scope.pmHistory[i].receiver && $scope.receiveName === $scope.pmHistory[i].sender))
				{
					$scope.currentPmHistory.push($scope.pmHistory[i]);
				}
			}
		}

	};

	showPM = function() {
			$scope.currentPmHistory = [];
			for(var i = 0; i < $scope.pmHistory.length; i++)
			{
				if(($scope.currentUser === $scope.pmHistory[i].sender && $scope.receiveName === $scope.pmHistory[i].receiver) || 
					($scope.currentUser === $scope.pmHistory[i].receiver && $scope.receiveName === $scope.pmHistory[i].sender))
				{
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
			$scope.PMsender = username;
			showPM();

	});

	$scope.pmRecevied = function (PMsender) {
		$scope.pmToUser(PMsender);
		$scope.PMsender = '';
	}

	$scope.kickUser = function (user) {
		socket.emit('kick', { room: $scope.currentRoom , user: user }, function (success) {
			// if success: use toastr to notify room that user was kicked 
		});
	};

	socket.on('kicked', function (room, user, username) {
		// use toastr to notify user he was kicked
		// reroute user that was kicked to rooms
		// notify chat that a user was kicked
		if($scope.currentUser === user) {
			$location.path('/rooms/' + $scope.currentUser);
		}
	});

	$scope.banUser = function (user) {
		socket.emit('ban', { room: $scope.currentRoom , user: user }, function (success) {
			console.log(user);
			// if success: use toastr to notify user was kicked 
		});
	};

	socket.on('banned', function(room, user, username) {
		// use toastr to notify user he was banned
		//	 reroute user that was kicked to rooms
		// notify chat that a user was banned
		if($scope.currentUser === user) {
			$location.path('/rooms/' + $scope.currentUser);
		}
	});
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

ChatClient.filter('kickBanForOps', function($routeParams, socket) {
	var ops2 = {};
	var user = $routeParams.user;
	var room = $routeParams.room;

	socket.on('updateusers', function (roomName, users, ops) {
		if(roomName === room) {
			ops2 = ops;
		};
	});	
	
	return function (items) {
		if(ops2[user] !== undefined) {
			return items;
		}
	};
});