var ChatClient = angular.module('ChatClient', ['ngRoute']);

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

	socket.on('updateusers', function (roomName, users, ops) {
		if(roomName === $scope.currentRoom) {
			console.log(users);
			console.log(roomName);
			$scope.currentUsers = users;
		}
	});		

	socket.emit('joinroom', { room: $scope.currentRoom }, function (success, reason) {
		if (!success) {
			$scope.errorMessage = reason;
		}
	});

	$scope.leaveRoom = function () {
		socket.emit('partroom', $scope.currentRoom);
        $location.path('/rooms/' + $scope.currentUser);
	};

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
		if($scope.receiveName === '') {
			$scope.pmErrorMessage = 'You must specify a username';
		}
		if($scope.privateMsg === '') {
			//$scope.errorMessage = 'Message can not be blank';
		}
		else {
			socket.emit('privatemsg', { nick: $scope.receiveName, message: $scope.privateMsg }, function (success) {
				if(success) {
					$scope.successMessage = 'PM successfully sent';
				} else {
					$scope.pmErrorMessage = 'Failed to send PM';
				}
			});
		}
	};

	socket.on('recv_privatemsg', function(username, message) {
		$scope.PMsender = username;
		$scope.receivedMsg = message;
	});
});