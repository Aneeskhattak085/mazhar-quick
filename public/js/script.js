angular.module('myApp', ["ui.router","restangular"])
.controller("personCtrl",function($scope,Restangular){

     $scope.register= function(){
								
		var bat={
				user_id:$scope.userID,
				user_username:$scope.UserName
			}
		Restangular.all("postUser").post(bat);
		console.log("dss");
		}
	

	
	$scope.getAllUsersList=function(){
				
		Restangular.all("userList").getList().then(function(responce){
		console.log(responce);
		
		
		});
	}
	
	

	
	
	
	
	$scope.login=function(){
		alert("dvv");
		var username=$scope.UserName;
		var pas=$scope.userID;
		Restangular.one("login",username,pas).get().then(function(responce){
		//console.log(responce);
		responce.user.user_id=responce.token;
		var isam=responce.user;
		//console.log(isam);
		//console.log("response.user.user_id");
		//deleteUser(isam.user_username);
		//putit(isam);
		
		
		
		});
	}
	
	function putit(rec){
		Restangular.all("putUser").post(rec);
			
			console.log("responce from putitscript");
			console.log(rec.user_id);
			console.log("responce from putitscript");
	}

	function deleteUser(username){
		
		Restangular.one("deleteUser",username).remove();
		console.log(username+"to del");
	}
	
	
	
	
 });