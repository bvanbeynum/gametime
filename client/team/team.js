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
			$scope.state = "schedule";
			break;
		}
	};
	
	$scope.selectTeam = function (team) {
		$scope.state = "loading";
		
		$http({url: "/data/game?division=10U&teamname=" + team.name}).then(
			function (response) {
				$scope.selectedTeam = team;
				$scope.schedule = response.data.games.sort(function (prev, curr) {
					return new Date(prev.dateTime) - new Date(curr.dateTime);
				});
				
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
		$scope.state = "loading";
		$scope.selectedGame = game;
		
		var httpSuccess = function (response) {
			if (response.data.players.length == 0) {
				$mdToast.show(
					$mdToast.simple()
						.textContent("No players found")
						.position("bottom left")
						.hideDelay(3000)
				);
				
				console.log(response);
				$scope.selectedGame = null;
				$scope.state = "schedule";
				return;
			}
			
			var players = response.data.players.sort(function (prev, curr) {
				if (prev.draftRank || curr.draftRank) {
					return (prev.draftRank ? prev.draftRank : 99) - (curr.draftRank ? curr.draftRank : 99);
				}
				else {
					return prev.firstName > curr.firstName;
				}
			});
			
			if ($scope.selectedGame.awayTeam.id == players[0].team.id) {
				$scope.selectedGame.awayTeam.players = players;
			}
			else {
				$scope.selectedGame.homeTeam.players = players;
			}
			
			if ($scope.selectedGame.homeTeam.players && $scope.selectedGame.awayTeam.players) {
				$scope.state = "game";
			}
		};
		
		var httpError = function (response) {
			$mdToast.show(
				$mdToast.simple()
					.textContent("There was an error loading")
					.position("bottom left")
					.hideDelay(3000)
			);
			
			console.log(response);
			$scope.selectedGame = null;
			$scope.state = "schedule";
		};
		
		$http({url: "/data/player?division=10U&teamname=" + game.awayTeam.name}).then(httpSuccess, httpError);
		$http({url: "/data/player?division=10U&teamname=" + game.homeTeam.name}).then(httpSuccess, httpError);
	};
	
});