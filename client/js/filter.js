angular.module("ChatClient").filter('removeCurrentUser', ['$routeParams',
	function ($routeParams) {
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
}]);