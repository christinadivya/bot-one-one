var App = angular.module('ChatRoom',['ngResource','ngRoute','ngStorage','socket.io','ngFileUpload','Controllers','Services'])
.run(["$rootScope", function ($rootScope){
	//  $rootScope.baseUrl = 'http://52.45.171.205:8502/'; //Application URL
	$rootScope.baseUrl = 'http://13.126.155.93:9002/'
}]);
App.config(function ($routeProvider, $socketProvider){
	$socketProvider.setConnectionUrl('http://13.126.155.93:9002/'); // Socket URL 52.205.184.251:88

	// $socketProvider.setConnectionUrl('http://devservices.lntecc.com'); // Socket URL 52.205.184.251:88
	// $socketProvider.setResource('/node/ConverseApp/iisnode.js/socket.io');

	$routeProvider	// AngularJS Routes
	.when('/v1/', {
		templateUrl: 'app/views/login.html',
		controller: 'loginCtrl'
	})
	.when('/v1/Users', {
		templateUrl: 'app/views/user.html',
		controller: 'userCtrl'
	})
	.when('/v1/ChatRoom', {
		templateUrl: 'app/views/chatRoom.html',
		controller: 'chatRoomCtrl'
	})
	.when('/v1/CreateGroup', {
		templateUrl: 'app/views/createGroup.html',
		controller: 'createGroupCtrl'
	})
	.when('/v1/ChatGroup', {
		templateUrl: 'app/views/chatRoom.html',
		controller: 'chatGroupCtrl'
	})
	.otherwise({		
        redirectTo: '/v1/'	// Default Route
    });
});
