/* global angular */
/* global d3 */

var statsApp = angular.module("statsApp", ["ngMaterial"]);

var log = {};

statsApp.config(function($mdThemingProvider) {
	$mdThemingProvider.theme("default")
		.primaryPalette("teal")
		.accentPalette("blue");
});

statsApp.controller("statsController", function ($scope, $http, $mdToast, $mdDialog) {
	log.scope = $scope;
	log.http = $http;
	
	$scope.isLoading = true;
	
	$http({url: "/data/player?teamname=boilermakers"})
		.then(function (response) {
			$scope.players = response.data.players;
			
			var throwingScale = d3.scaleLinear()
				.domain([
					d3.max($scope.players.map(function (player) { return player.throwing })),
					d3.min($scope.players.map(function (player) { return player.throwing }))
					])
				.range([0, 255]);
			
			$scope.selectedFields = Object.keys($scope.players[0]).filter(function (field) {
				return ["draftRank", "draftRound", "firstName", "lastName", "coachProtect", "throwing", "catching", "runTime"].some(function (display) { return field == display });
			});
			
			$scope.isLoading = false;
		}, function (response) {
			$mdToast.show(
				$mdToast.simple()
					.textContent("There was an error loading")
					.position("bottom left")
					.hideDelay(3000)
			);
			
			console.log(response);
			$scope.isLoading = false;
	});
});