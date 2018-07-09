var app = angular.module('home', []);
app.controller('homeCtrl', function($scope) {
    $scope.firstName = "John";
    $scope.lastName = "Doe";
    $scope.homefullName = function() {
		console.log( "home");
		console.log( $scope.firstName);
			console.log($scope.lastName);
        return $scope.firstName + " " + $scope.lastName;
    };
});