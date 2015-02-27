angular.module("ChatClient").controller('NavigationController', ['$scope', '$location', '$rootScope', '$routeParams', 'socket',
	function ($scope, $location, $rootScope, $routeParams, socket) {
	$scope.disconnecting = function () {
		socket.emit('disconnect2', function () {

		});
		$location.path('/login');
	};
}]);
