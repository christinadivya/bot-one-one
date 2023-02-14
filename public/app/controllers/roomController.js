angular.module('Controllers',[])
.directive('focusMe', function($timeout) {	// Custom directive for focus
    return {
        link: function(scope, element, attrs) {
          scope.$watch(attrs.focusMe, function(value) {
            if(value === true) { 
              $timeout(function() {
                element[0].focus();
                scope[attrs.focusMe] = false;
              });
            }
          });
        }
    };
})
.controller('roomCtrl', function ($scope, $location, $rootScope, $socket){		// Main Controller
	// Varialbles Initialization.
	$scope.isErrorReq = false;
	$scope.isErrorNick = false;
	$scope.roomname = "";

	// redirection if user logged in.
	if($rootScope.roomname){
		$location.path('/v1/');
	}

	// Functions for controlling behaviour.
	$scope.redirect = function(){
		if ($scope.roomname.length <= 20) {
			if($scope.roomname){
				$socket.emit('create room',$scope.roomname,function(data){
					if(data.success == true){	// if nickname doesn't exists	
						$rootScope.roomname = $scope.roomname;						
						$location.path('/v1/');					
					}else{		// if nickname exists
						$scope.errMsg = "Use different roomname.";
						$scope.isErrorNick = true;
						$scope.isErrorReq = true;
						$scope.printErr($scope.errMsg);	
					}			
				});
			}else{		// blanck nickname 
				$scope.errMsg = "Enter a roomname.";
				$scope.isErrorReq = true;
				$scope.printErr($scope.errMsg);
			}
		}else{		// nickname greater than limit
			$scope.errMsg = "Roomname exceed 20 charachters.";
			$scope.isErrorNick = true;
			$scope.isErrorReq = true;
			$scope.printErr($scope.errMsg);
		}
	}

	$scope.printErr = function(msg){	// popup for error message
		var html = '<p id="alert">'+ msg +'</p>';
		if ($( ".chat-box" ).has( "p" ).length < 1) {
			$(html).hide().prependTo(".chat-box").fadeIn(1500);
			$('#alert').delay(1000).fadeOut('slow', function(){
				$('#alert').remove();
			});
		};
	}

})
