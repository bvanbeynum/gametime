/* global angular */

var snacksApp = angular.module("snacksApp", ["ngMaterial"]);

var log = {};

snacksApp.config(function($mdThemingProvider) {
	$mdThemingProvider.theme("default")
		.primaryPalette("teal")
		.accentPalette("blue");
});

snacksApp.controller("snacksCtl", function ($scope, $http, $mdToast, $mdDialog) {
	var params = new URLSearchParams(window.location.search);;
	
	$scope.emailId = null;
	
	log.scope = $scope;

	$scope.emailId = params.get("emailid");
	$scope.isLoading = true;
	
	$http({ url: "/snacks/load?emailid=" + $scope.emailId }).then(
		function (response) {
			$scope.games = response.data.games;
			$scope.teamName = response.data.teamName;
			$scope.parentEmails = response.data.parentEmails;
			
			$scope.selectedParent = $scope.parentEmails.find(function (parent) { return parent._id == $scope.emailId });
			
			$scope.games.forEach(function (game) {
				game.snack = $scope.parentEmails.find(function (parent) { return parent._id == game.snackSignupParentId });
			});
			
			if (!$scope.selectedParent) {
				window.location.replace("/snacks");
				return;
			}
			
			$scope.isLoggedIn = true;
			$scope.isLoading = false;
		}, function (error) {
			$mdToast.show(
				$mdToast.simple()
					.textContent("There was an error loading")
					.position("bottom left")
					.hideDelay(3000)
			);
			
			window.location.replace("/snacks");
			console.log(error);
		});

	$scope.parentSelect = function () {
		$scope.emailId = $scope.selectedParent._id;
		
		$http({ url: "/snacks/load?emailid=" + $scope.emailId }).then(
			function (response) {
				$scope.games = response.data.games;
				$scope.parentEmails = response.data.parentEmails;
				
				$scope.games.forEach(function (game) {
					game.snack = $scope.parentEmails.find(function (parent) { return parent._id == game.snackSignupParentId });
				});
				
				$scope.isLoggedIn = true;
				$scope.isLoading = false;
			}, function (error) {
				$mdToast.show(
					$mdToast.simple()
						.textContent("There was an error loading")
						.position("bottom left")
						.hideDelay(3000)
				);
				
				console.log(error);
			});
	};
	
	$scope.selectGame = function (game) {
		game.snackSignupParentId = $scope.emailId;
		game.snack = $scope.parentEmails.find(function (parent) { return parent._id == game.snackSignupParentId });
		
		$http.post("/data/game", { game: game }).then(
			function (response) {
				console.log("Saved game: " + response.data.gameId);
			}, function (error) {
				$mdToast.show(
					$mdToast.simple()
						.textContent("There was an error saving")
						.position("bottom left")
						.hideDelay(3000)
				);
				
				console.log(error);
			});
	};
	
	$scope.removeGame = function (game) {
		game.snackSignupParentId = null;
		game.snack = null;
		
		$http.post("/data/game", { game: game }).then(
			function (response) {
				console.log("Saved game: " + response.data.gameId);
			}, function (error) {
				$mdToast.show(
					$mdToast.simple()
						.textContent("There was an error saving")
						.position("bottom left")
						.hideDelay(3000)
				);
				
				console.log(error);
			});
	};
	
});