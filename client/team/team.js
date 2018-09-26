/* global angular */
/* global d3 */

var teamApp = angular.module("teamApp", ["ngMaterial", "ngRoute"]);

var log = {};

teamApp.config(function($mdThemingProvider, $routeProvider) {
	$mdThemingProvider.theme("default")
		.primaryPalette("teal")
		.accentPalette("blue");
	
	$routeProvider
	.when("/standings", {
		templateUrl: "/team/standings.html",
		controller: "standingsCtl"
	})
	.when("/schedule", {
		templateUrl: "/team/schedule.html",
		controller: "scheduleCtl"
	})
	.when("/game", {
		templateUrl: "/team/game.html",
		controller: "gameCtl"
	})
	.otherwise({
		redirectTo: "/standings"
	});
});

teamApp.controller("standingsCtl", function($rootScope, $scope, $http, $location, $mdToast, $mdDialog) {
	log.standings = $scope;
	$rootScope.isLoading = true;
	
	$rootScope.selectedTeam = null;
	$rootScope.selectedGame = null;
	
	$http({url: "/data/team?division=10U"}).then(
		function (response) {
			var teams = response.data.teams;
			
			$http({url: "/data/game?division=10U"}).then(
				function (response) {
					
					$rootScope.schedule = response.data.games.sort(function (prev, curr) {
						return new Date(prev.dateTime) - new Date(curr.dateTime);
					});
					
					$rootScope.teams = teams.map(function (team) {
						return {
							id: team.id,
							name: team.name,
							confrence: team.confrence,
							img: "/team/media/" + team.name.toLowerCase().replace(/ /, "") + ".png",
							wins: $rootScope.schedule.filter(function (game) {
									return (game.awayTeam.id == team.id && game.awayTeam.isWinner) ||
										(game.homeTeam.id == team.id && game.homeTeam.isWinner);
								}).length,
							losses: $rootScope.schedule.filter(function (game) {
									return (new Date(game.dateTime)) < (new Date()) && (
											(game.awayTeam.id == team.id && !game.awayTeam.isWinner) ||
											(game.homeTeam.id == team.id && !game.homeTeam.isWinner)
										);
								}).length
						};
					});
					
					$rootScope.teams.forEach(function (team) {
						team.ratio = (team.wins + team.losses > 0) ? team.wins / (team.wins + team.losses) : 0;
					});
					
					$rootScope.schedule.forEach(function (game) {
						game.awayTeam.team = $rootScope.teams.find(function (team) { return team.id == game.awayTeam.id });
						game.homeTeam.team = $rootScope.teams.find(function (team) { return team.id == game.homeTeam.id });
					});
					
					$scope.confrences = d3.nest()
						.key(function (team) { return team.confrence })
						.entries($rootScope.teams)
						.map(function (group) {
							return { 
								name: group.key, 
								teams: group.values.sort(function (prev, curr) {
									return prev.ratio != curr.ratio ? prev.ratio < curr.ratio : prev.name > curr.name;
								})
							};
						});
					
					$rootScope.isLoading = false;
				}, function (response) {
					$mdToast.show(
						$mdToast.simple()
							.textContent("There was an error loading")
							.position("bottom left")
							.hideDelay(3000)
					);
					
					console.log(response);
					$rootScope.isLoading = false;
				});
			
		}, function (response) {
			$mdToast.show(
				$mdToast.simple()
					.textContent("There was an error loading")
					.position("bottom left")
					.hideDelay(3000)
			);
			
			console.log(response);
			$rootScope.isLoading = false;
		});
	
	$scope.selectTeam = function (team) {
		$rootScope.selectedTeam = team;
		$location.path("/schedule");
	};
	
});

teamApp.controller("scheduleCtl", function($rootScope, $scope, $http, $location, $mdToast, $mdDialog) {
	if (!$rootScope.selectedTeam) {
		$location.path("/standings");
	}
	
	log.schedule = $scope;
	$rootScope.selectedGame = null;
	
	$scope.teamSchedule = $rootScope.schedule.filter(function (game) {
		return game.awayTeam.id == $rootScope.selectedTeam.id || game.homeTeam.id == $rootScope.selectedTeam.id;
	});
	
	$scope.selectGame = function (game) {
		$rootScope.isLoading = true;
		$rootScope.selectedGame = game;
		$location.path("/game");
	};
	
});

teamApp.controller("gameCtl", function($rootScope, $scope, $http, $location, $mdToast, $mdDialog) {
	if (!$rootScope.selectedTeam) {
		$location.path("/standings");
	}
	else if (!$rootScope.selectedGame) {
		$location.path("/schedule");
	}
	
	log.game = $scope;
	
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
			$location.path("/schedule");
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
		
		if ($rootScope.selectedGame.awayTeam.id == players[0].team.id) {
			$rootScope.selectedGame.awayTeam.players = players;
		}
		else {
			$rootScope.selectedGame.homeTeam.players = players;
		}
		
		if ($rootScope.selectedGame.homeTeam.players && $rootScope.selectedGame.awayTeam.players) {
			$rootScope.isLoading = false;
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
		$location.path("/schedule");
	};
	
	$http({url: "/data/player?division=10U&teamname=" + $rootScope.selectedGame.awayTeam.name}).then(httpSuccess, httpError);
	$http({url: "/data/player?division=10U&teamname=" + $rootScope.selectedGame.homeTeam.name}).then(httpSuccess, httpError);
});

teamApp.controller("teamController", function ($rootScope, $scope, $http, $location, $mdToast, $mdDialog) {
	log = {root: $rootScope, team: $scope};
	log.http = $http;
	
	$rootScope.isLoading = false;
	
	$scope.back = function () {
		switch ($location.path()) {
		case "/schedule":
			$location.path("/standings");
			break;
		
		case "/game":
			$location.path("/schedule");
			break;
		}
	};
	
});