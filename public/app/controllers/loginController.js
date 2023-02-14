angular.module('Controllers', [])
	.directive('focusMe', function ($timeout) {	// Custom directive for focus
		return {
			link: function (scope, element, attrs) {
				scope.$watch(attrs.focusMe, function (value) {
					if (value === true) {
						$timeout(function () {
							element[0].focus();
							scope[attrs.focusMe] = false;
						});
					}
				});
			}
		};
	})
	.controller('loginCtrl', function ($scope, $location, $rootScope, $socket) {		// Login Controller
		// Varialbles Initialization.
		$scope.userAvatar = "Avatar1.jpg";
		$scope.isErrorReq = false;
		$scope.isErrorNick = false;
		$scope.username = "";

		// redirection if user logged in.
		if ($rootScope.loggedIn) {
			$location.path('/v1/Users');
		}

		// Functions for controlling behaviour.
		$scope.redirect = function () {
			if ($scope.username.length <= 20) {
				if ($scope.username) {
					// creat room
					let create_room = {
						// 19. create-broadcast: EMIT (send) 
						groupname: 'broadCast',
						creatorId: 1,
						users: [{ userId: 1, username: "div1" },
						{ userId: 2, username: "div2" },

						{ userId: 3, username: "div3" },]

					}
					//send message
					let data = {
						roomname: 'group here',
						username: "durai",
						msg: 'coffee snacks',
						istype: "text",
						isGroup: true,
						userId: 1,
						hasFile: false,
						msgTime: "",
						chatRoomId: 92,
						isReply: false,
						contact_name: "name",
						contact_number: "number",
						lat: "12.2356989",
						long: "13.54875",
						isReply: true,
						replayMsgId: null,
						messageContant: null
					}
					let datas = { roomId: data.chatRoomId, userId: data.userId, active: false }
 let oneonone={chatRoomId:18,userId: 1,}
//  socket.on('exit-group', function (data, callback) {
 
	let exitdata = {
	 groupname:"Test",
	  chatRoomId:98,
	  userId:"80eb8d99-2383-4b5e-aadf-4bbb797ccac2",
 	  leftType: "left",

	};	
	let remove_group={
		groupname: "cd",
		creatorId: '80eb8d99-2383-4b5e-aadf-4bbb797ccac2',
		chatRoomId: 158,
		users: [{ 
		userId: 'c7d88524-2503-41c9-94b0-144329956ebb',
 							
		},
		{ 
		userId: '75031685-e6fc-40f6-b851-ca6a19529d11',
  							
		}]	  
		}
		let add_members={
			groupname: "cd",
			creatorId: '80eb8d99-2383-4b5e-aadf-4bbb797ccac2',
			chatRoomId: 158,
			users: [{ 
			userId: 'c7d88524-2503-41c9-94b0-144329956ebb',
								 
			},
			{ 
			userId: '75031685-e6fc-40f6-b851-ca6a19529d11',
								  
			}]	  
			}

		
	// $socket.emit('add-group-members', add_members, function (data) {

	// $socket.emit('remove-group-members', remove_group, function (data) {

				// $socket.emit('exit-group', exitdata, function (data) {

				// $socket.emit('join-1on1-room', oneonone, function (data) {
// 
					// $socket.emit('update-user-active-status', datas, function (data) {

						//  $socket.emit('send-message', data, function (data) {
							// let join_chat={senderId:"bd2ca43d-6572-496b-b716-c127919a1e4c",receiverId:"75031685-e6fc-40f6-b851-ca6a19529d11"}

    						// $socket.emit('join-user-chat', join_chat, function (data) {

	// 					 $socket.emit('create-broadcast', create_room, function (data) {
	// 					// $socket.emit('send-broadcast-message', data, function (data) {

	// })
					$socket.emit('new-user', { userId: 1, username: $scope.username, userAvatar: $scope.userAvatar }, function (data) {
						console.log("@@@@@@@3.new-user@@@@@@@@@")

						console.log(data, $scope)

						if (data.success == true) {	// if nickname doesn't exists	
							$rootScope.username = $scope.username;
							$rootScope.userAvatar = $scope.userAvatar;
							$rootScope.loggedIn = true;
							$location.path('/v1/Users');
						} else {		// if nickname exists
							$scope.errMsg = "Use different nickname.";
							$scope.isErrorNick = true;
							$scope.isErrorReq = true;
							$scope.printErr($scope.errMsg);
						}
					});
				} else {		// blanck nickname 
					$scope.errMsg = "Enter a nickname.";
					$scope.isErrorReq = true;
					$scope.printErr($scope.errMsg);
				}
			} else {		// nickname greater than limit
				$scope.errMsg = "Nickname exceed 20 charachters.";
				$scope.isErrorNick = true;
				$scope.isErrorReq = true;
				$scope.printErr($scope.errMsg);
			}
		}

		$scope.printErr = function (msg) {	// popup for error message
			var html = '<p id="alert">' + msg + '</p>';
			if ($(".chat-box").has("p").length < 1) {
				$(html).hide().prependTo(".chat-box").fadeIn(1500);
				$('#alert').delay(1000).fadeOut('slow', function () {
					$('#alert').remove();
				});
			};
		}
		$scope.changeAvatar = function (avatar) {		// secting different avatar
			$scope.userAvatar = avatar;
		}
	})
	.controller('userCtrl', function ($scope, $location, $rootScope, $socket, $localStorage) {		// User Controller
		// Varialbles Initialization.
		$scope.users = [];
		$scope.groups = [];
		$scope.isErrorReq = false;
		$scope.isErrorNick = false;
		// ================================== Online Members List ===============================
		$socket.emit('get-online-members', { username: $rootScope.username }, function (data) {
		});
		$socket.on("online-members", function (data) {
			$scope.oldusers = $localStorage.localUsers;
			// console.log($localStorage.localUsers);	
			$scope.users = [];
			if (data && data.length > 0) {
				for (var i = 0; i < data.length; i++) {
					data[i].highlight = false;
					if (data[i].username != $rootScope.username) {
						$scope.users.push(data[i]);
					}
				}
				if ($scope.oldusers && $scope.oldusers.length > 0) {
					for (var k = 0; k < $scope.oldusers.length; k++) {
						if ($scope.users && $scope.users.length > 0) {
							for (l = 0; l < $scope.users.length; l++) {
								if ($scope.oldusers[k].username == $scope.users[l].username && $scope.oldusers[k].highlight) {
									$scope.users[l].highlight = true;
									break;
								}
							}
						}
						console.log($scope.users);
						$localStorage.localUsers = $scope.users;
					}
				}
			}
		});

		$socket.emit('get-group', { username: $rootScope.username }, function (data) {
		});
		$socket.on("online-group", function (data) {
			$scope.oldgroups = $localStorage.localGroups;
			$scope.groups = [];
			if (data && data.length > 0) {
				for (var i = 0; i < data.length; i++) {
					data[i].highlight = false;
					if (data[i].users != null && data[i].users.length) {
						for (var k = 0; k < data[i].users.length; k++) {
							if (data[i].users[k].username == $rootScope.username) {
								$scope.groups.push(data[i]);
							}
						}
					}
				}
				if ($scope.oldgroups && $scope.oldgroups.length > 0) {
					for (var l = 0; l < $scope.oldgroups.length; l++) {
						if ($scope.groups && $scope.groups.length > 0) {
							for (var m = 0; m < $scope.groups.length; m++) {
								if ($scope.oldgroups[l].groupname == $scope.groups[m].groupname && $scope.oldgroups[l].highlight) {
									$scope.groups[m].highlight = true;
									break;
								}
							}
						}
						$localStorage.localGroups = $scope.groups;
					}
				}
			}
		});


		$scope.removeGroupMembers = function () {
			console.log("removeGroupMembers clicked!!!")
			let grpInp = {
				groupname: "cd",
				creatorId: 488,
				chatRoomId: 110,
				users: [{
					userId: 523,
					username: 'ANNAMALAI T',
					userAvatar: 'Avatar1.jpg'
				}]
			}
			$socket.emit('remove-group-members', grpInp, function (data) {

				console.log("@@@@ remove-group-members @@@")
				// console.log(data)

				// $socket.emit('get-group',{userId: 1, username: 'kl'},function(data){
				// 	console.log("@@@@ get-group @@@")
				// 	console.log(data)
				// });			
			});
		}


		$scope.onlineMembers = function () {
			console.log("onlineMembers clicked!!!")
			let userId = {
				"userId": 718
			}
			$socket.emit('get-user-online-status', userId, function (data) {
				console.log("@@@@ 1.get-user-online @@@")
				// console.log(data)
			});
			$socket.on("user-online-status", function (data) {
				console.log("@@@@@@@ 2.user-online @@@@@@@@@")
				console.log(data)
			});

			// $socket.emit('get-online-members',{},function(data){	
			// 	console.log("@@@@ 1.get-online-members @@@")
			// 	console.log(data)
			// });
			// $socket.on("online-members", function(data){
			// 	console.log("@@@@@@@ 2.online-members @@@@@@@@@")	
			// 	console.log(data)
			// });
		}



		$scope.sendRequest = function () {
			console.log("sendRequest clicked!!!")
			let grpInp = {
				"TCHAT_REQUEST_Sender": 121904,
				"TCHAT_REQUEST_Receiver": 172722
			}
			$socket.emit('send-chat-request', grpInp, function (data) {

				console.log("@@@@ 1.send-chat-request @@@")
				console.log(data)
			});



			console.log("delete message clicked!!!")
			let grpInp = {
				messageId: 4737,
				roomname: 'iphone1',
				username: 't',
				hasMsg: true,
				hasFile: false,

				isGroup: true,
				userId: 135619,
				chatRoomId: 370
			}

			$socket.emit('delete-message', grpInp, function (data) {

				console.log("@@@@ delete messaget @@@")
				console.log(data)
			});
		}
		$socket.on("chat-request-response", function (data) {
			console.log("@@@@@@@2.chat-request-response @@@@@@@@@")
			console.log(data)
		});




		$scope.addGroupMembers = function () {
			console.log("AddGroupMembers clicked!!!")
			let grpInp = {
				groupname: "text group",
				creatorId: 135619,
				chatRoomId: 436,
				users: [{
					userId: 1050,
					username: 'u1',
					userAvatar: 'Avatar1.jpg'
				},
				{
					userId: 1052,
					username: 'u2',
					userAvatar: 'Avatar1.jpg'
				}]
			}
			$socket.emit('add-group-members', grpInp, function (data) {

				console.log("@@@@ add-group-members @@@")
				console.log(data)

				// $socket.emit('get-group',{userId: 1, username: 'kl'},function(data){
				// 	console.log("@@@@ get-group @@@")
				// 	console.log(data)
				// });			
			});
		}

		// forward message to chat room users
		$scope.ForwardMessage = function () {

			$socket.emit("send-message-to-users",
				{
					userId: 488,
					username: 'test1',
					userAvatar: 'Avatar1.jpg',
					msg: 'test message',
					hasMsg: true,
					hasFile: false,
					msgTime: '2:12 pm',
					istype: "image/music/PDF",
					isGroup: true,
					users:
						[{
							chatRoomId: 78,
							roomname: 'test1-test2'
						},
						{
							chatRoomId: 79,
							roomname: 'test1-test3'
						}]
				}


				, function (data) {
					console.log("$$$$$$$$$ send-message-to-users $$$$$$$$$$")
					console.log(data)

				});

		}

		// ================================== 1 on 1 room ===============================
		$socket.on("1on1-room-name", function (data) {
			console.log("@@@@@@@2.1on1-room-name@@@@@@@@@")
			console.log(data)
			$rootScope.roomname = data.roomName;
		});

		$scope.replyToChatRequest = function (requestType) {
			let replyChatReqInput = {
				"senderId": "caa1148d-88c8-477b-bed3-f474292f1f07",
				"receiverId": "21187316-7728-41ad-a83e-6433c22d8175"
				// "senderUsername": "kl",
				// "receiverUsername": "FS"
			};
			$socket.emit('join-chat', replyChatReqInput, function (data) {
				console.log("@@@@@@@1.join-chat@@@@@@@@@")
				console.log(data)

			});
		}



		$scope.joinOneToOneRoom = function (requestType) {
			console.log("#############33234234234")
			let replyChatReqInput = {
				"chatRoomId": 14
			};
			$socket.emit('join-1on1-room', replyChatReqInput, function (data) {
				console.log("@@@@@@@ 3.join-1on1-room @@@@@@@@@")
				console.log(data)

			});
		}


		$scope.create1on1Room = function (user) {
			$scope.roomname = user.username + "-" + $rootScope.username;


			if ($scope.roomname) {
				$socket.emit('create 1on1 room', $scope.roomname, function (data) {

					if (data.success == true) {	// if nickname doesn't exists	
						//$rootScope.roomname = $scope.roomname;					
						//$localStorage.localUsers = $scope.users;					
						$localStorage.localGroups = $scope.groups;
						if ($scope.users && $scope.users.length > 0) {
							for (var i = 0; i < $scope.users.length; i++) {
								if ($scope.users[i].username == user.username) {
									$scope.users[i].highlight = false;
									$localStorage.localUsers = $scope.users;
									$location.path('/v1/ChatRoom');
								}
							}
						}
					} else {		// if nickname exists
						$scope.errMsg = "Use different roomname.";
						$scope.isErrorNick = true;
						$scope.isErrorReq = true;
						$scope.printErr($scope.errMsg);
					}
				});
			} else {		// blanck nickname 
				$scope.errMsg = "Enter a roomname.";
				$scope.isErrorReq = true;
				$scope.printErr($scope.errMsg);
			}
		}

		$scope.joinGroupRoom = function (groupname) {
			console.log("##### Join Group #######")
			console.log(groupname)

			$socket.emit('join-group', { groupname: groupname }, function (data) {
				if (data.success == true) {
					$rootScope.roomname = groupname;
					$localStorage.localUsers = $scope.users;
					$localStorage.localGroups = $scope.groups;
					$location.path('/v1/ChatGroup');
				}
			})
		}

		$scope.goToCreateGroup = function () {
			$localStorage.localUsers = $scope.users;
			$localStorage.localGroups = $scope.groups;
			$location.path('/v1/CreateGroup');
		}

		$scope.printErr = function (msg) {	// popup for error message
			var html = '<p id="alert">' + msg + '</p>';
			if ($(".chat-box").has("p").length < 1) {
				$(html).hide().prependTo(".chat-box").fadeIn(1500);
				$('#alert').delay(1000).fadeOut('slow', function () {
					$('#alert').remove();
				});
			};
		}

		// redirection if user is not logged in.
		if (!$rootScope.loggedIn) {
			$location.path('/v1/');
		}

		$socket.on('highlight-room', function (data) {
			console.log("@@@@@@@@@@@ highlight-room @@@@@@@@@@@@@@@@")
			console.log(data)
			if (data != null && data.username && !data.isGroup && $scope.users && $scope.users.length > 0) {
				for (var i = 0; i < $scope.users.length; i++) {
					if ($scope.users[i].username == data.username && data.receiverUsername == $rootScope.username) {
						$scope.users[i].highlight = true;
					}
				}
			}
			if (data != null && data.roomname && data.isGroup && $scope.groups && $scope.groups.length > 0) {
				for (var i = 0; i < $scope.groups.length; i++) {
					if ($scope.groups[i].groupname == data.roomname) {
						$scope.groups[i].highlight = true;
					}
				}
			}
		});
		$socket.on("new-message", function (data) {

			console.log("NEW MESSAGE!!!!!!!!!!!!!!!!!!!", data)
			// console.log(data)	

			// $socket.emit("update-message-status", { chatRoomId: 100, status: "Delivered" }, function(data){
			// 	console.log("$$$$$$$$$ message-status $$$$$$$$$$")
			// 	console.log(data)
			// });


			if (data.username == $rootScope.username) {
				data.ownMsg = true;
			} else {
				data.ownMsg = false;
			}
			// $scope.messeges.push(data);	
		});

	})