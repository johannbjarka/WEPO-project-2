angular.module("ChatClient").controller('RoomController', ['$scope', '$location', '$rootScope', '$routeParams', 'socket', 'toastr',
	function ($scope, $location, $rootScope, $routeParams, socket, toastr) {
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
	$scope.topic = '';
	$scope.topic2 = '';
	$scope.password = '';

	socket.emit('joinroom', { room: $scope.currentRoom }, function (success, reason) {
		if (!success) {
			if(reason === 'banned') {
				toastr.error('You have been banned from this room', 'Attention!');
				// Send user back to rooms.
				$location.path('/rooms/' + $scope.currentUser);
			}
			else if(reason === 'wrong password') {
				var password = prompt('Enter password', "");
				socket.emit('joinroom', { room: $scope.currentRoom, pass: password }, function (success, reason) {
					if(success) {
						// Do nothing.
					} else if(reason === 'wrong password') {
						toastr.error('Wrong password', 'Warning!');
						// Send user back to rooms
						$location.path('/rooms/' + $scope.currentUser);
					} 
				});
			}		
		}
	});

	socket.on('updateusers', function (roomName, users, ops) {
		if(roomName === $scope.currentRoom) {
			$scope.currentUsers = users;
			// Check if current user is an op so we can show op controls in the HTML
			if(ops[$scope.currentUser] !== undefined) {
				$scope.currentOp = $scope.currentUser;
			} else {
				$scope.currentOp = '';
			}
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

			setTimeout(scrollbottom(), 3000);
		}
	});

	function scrollbottom() {
		var chatele = $(".scroll");

		var chatheight = chatele.prop("scrollHeight");
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
		setTimeout(scrollbottom(), 1000);
	};

	$scope.setPassword = function () {
		if($scope.password === '') {
			toastr.warning('Choose a password', 'Warning!');
		} else {
			socket.emit('setpassword', {room: $scope.currentRoom, password: $scope.password}, function (success) {
				if(success) {
					toastr.success('Password has been set', 'Success!');	
					$scope.password = '';
				}
			});
		}
	};

	$scope.removePassword = function () {
		socket.emit('removepassword', {room: $scope.currentRoom}, function (success) {
			if(success) {
				toastr.success('Password has been removed', 'Success!');
			}
		});		
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

		if($scope.receiveName !== '' && username !== $scope.receiveName) {
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
		socket.emit('deop', { room: $scope.currentRoom , user: user }, function (success) {
		});
	};

	socket.on('deopped', function(room, user, username) {
		if($scope.currentUser === username) {
			var message = 'demoted ' + user + ' from being op of ' + room + '.';
			socket.emit('sendmsg', { roomName: room, msg: message });
		}
	});

	$scope.setTopic = function (topic) {
		socket.emit('settopic', { room: $scope.currentRoom , topic: topic });
		$scope.topic2 = '';
	};

	socket.on('updatetopic', function(room, topic, username) {
		$scope.topic = topic;
	});

	$scope.$on('$destroy', function () {
		socket.getSocket().removeAllListeners();
	});

	$scope.formatTimestamp = function (ts) {
		return moment(ts).format('HH:mm');
	};
}]);