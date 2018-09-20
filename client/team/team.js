/* global angular */
/* global d3 */

var teamApp = angular.module("teamApp", ["ngMaterial"]);

var log = {};

teamApp.config(function($mdThemingProvider) {
	$mdThemingProvider.theme("default")
		.primaryPalette("teal")
		.accentPalette("blue");
});

teamApp.controller("teamController", function ($scope, $http, $mdToast, $mdDialog) {
	log.scope = $scope;
	log.http = $http;
	
	$scope.state = "loading";
	
	$http({url: "/data/team?division=10U"}).then(
		function (response) {
			
			$scope.teams = response.data.teams.map(function (team) {
				return {
					id: team.id,
					name: team.name,
					confrence: team.confrence,
					wins: team.wins,
					losses: team.losses,
					img: "/team/media/" + team.name.toLowerCase().replace(/ /, "") + ".png",
					ratio: (team.wins + team.losses > 0) ? team.wins / (team.wins + team.losses) : 0
				};
			});
			
			$scope.confrences = d3.nest()
				.key(function (team) { return team.confrence })
				.entries($scope.teams)
				.map(function (group) {
					return { 
						name: group.key, 
						teams: group.values.sort(function (prev, curr) {
							return prev.ratio != curr.ratio ? prev.ratio < curr.ratio : prev.name > curr.name;
						})
					};
				});
			
			$scope.state = "confrence";
			
		}, function (response) {
			$mdToast.show(
				$mdToast.simple()
					.textContent("There was an error loading")
					.position("bottom left")
					.hideDelay(3000)
			);
			
			console.log(response);
			$scope.state = null;
		});
	
	$scope.back = function () {
		switch ($scope.state) {
		case "schedule":
			$scope.selectedTeam = null;
			$scope.state = "confrence";
			break;
		
		case "game":
			$scope.selectTeam($scope.selectedTeam);
			break;
		}
	};
	
	$scope.selectTeam = function (team) {
		$scope.state = "loading";
		
		$http({url: "/data/game?division=10U&teamname=" + team.name}).then(
			function (response) {
				$scope.selectedTeam = team;
				$scope.schedule = response.data.games;
				
				$scope.schedule.forEach(function (game) {
					game.awayTeam.team = $scope.teams.find(function (team) { return team.id == game.awayTeam.id });
					game.homeTeam.team = $scope.teams.find(function (team) { return team.id == game.homeTeam.id });
				});
				
				$scope.state = "schedule";
			}, function (response) {
				$mdToast.show(
					$mdToast.simple()
						.textContent("There was an error loading")
						.position("bottom left")
						.hideDelay(3000)
				);
				
				console.log(response);
				$scope.state = "confrence";
			});
	};
	
	$scope.selectGame = function (game) {
		
	}
	
});