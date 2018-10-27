/* global angular */
/* global d3 */

var teamApp = angular.module("teamApp", ["ngMaterial", "ngRoute"]);

var log = {};

teamApp.config(function($mdThemingProvider, $routeProvider, $locationProvider) {
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
		templateUrl: "/team/division.html",
		controller: "divisionCtl"
	});
	
	$locationProvider.html5Mode(true);
});

teamApp.controller("divisionCtl", function($rootScope, $scope, $http, $location, $mdToast, $mdDialog) {
	log.division = $scope;
	$rootScope.managedTeam = null;
	$rootScope.isLoading = true;
	
	$http({url: "/data/division"}).then(function (response) {
		$scope.divisions = response.data.divisions.sort(function (prev, curr) {
			return prev.name < curr.name ? -1 : 1;
		});
		
		$http({url: "/data/team?managed=true"}).then(function (response) {
			var teams = response.data.teams;
			
			$scope.divisions.forEach(function (division) {
				division.teams = teams.filter(function (team) { return team.teamDivision.id == division.id });
			});
			
			$scope.divisions = d3.nest()
				.key(function (division) { return division.name })
				.entries($scope.divisions)
				.map(function (group) {
					return {
						name: group.key, 
						teams: teams.filter(function (team) { return team.teamDivision.name == group.key })
							.map(function (team) {
								return {
									id: team.id,
									name: team.name,
									teamDivision: {
										id: team.teamDivision.id,
										name: team.teamDivision.name,
										year: team.teamDivision.year,
										season: team.teamDivision.season.replace(/\w\S*/g, function (text) { return text.charAt(0).toUpperCase() + text.substr(1).toLowerCase() })
									},
									img: "/team/media/" + team.name.toLowerCase().replace(/ /, "") + ".png"
								};
							})
							.sort(function (prev, next) { 
								if (prev.teamDivision.year < next.teamDivision.year) {
									return -1;
								}
								else if (prev.teamDivision.year > next.teamDivision.year) {
									return 1;
								}
								else {
									return prev.teamDivision.season > next.teamDivision.season ? -1 : 1;
								}
							})
					};
				})
				.sort(function (prev, next) { 
					return prev.name < next.name ? -1 : 1;
				});
			
			$scope.isLoading = false;
		});
	}, function (error) {
		$mdToast.show(
			$mdToast.simple()
				.textContent("There was an error loading")
				.position("bottom left")
				.hideDelay(3000)
		);
		
		console.log(error);
		$rootScope.isLoading = false;
	});
	
	$scope.selectTeam = function (team) {
		$rootScope.managedTeam = team;
		$location.path("/standings");
	};
});

teamApp.controller("standingsCtl", function($rootScope, $scope, $http, $location, $mdToast, $mdDialog) {
	log.standings = $scope;
	
	if (!$rootScope.managedTeam) {
		$location.path("/");
		return;
	}
	
	$rootScope.isLoading = true;
	
	$rootScope.selectedTeam = null;
	$rootScope.selectedGame = null;
	
	$http({url: "/data/team?divisionid=" + $rootScope.managedTeam.teamDivision.id}).then(
		function (response) {
			var teams = response.data.teams;
			
			$http({url: "/data/game?divisionid=" + $rootScope.managedTeam.teamDivision.id}).then(
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
									return (
											(game.awayTeam.id == team.id && game.awayTeam.isWinner) ||
											(game.homeTeam.id == team.id && game.homeTeam.isWinner)
										);
								}).length,
							losses: $rootScope.schedule.filter(function (game) {
									return (
											(game.awayTeam.isWinner || game.homeTeam.isWinner) && 
											(
												(game.awayTeam.id == team.id && !game.awayTeam.isWinner) ||
												(game.homeTeam.id == team.id && !game.homeTeam.isWinner)
											)
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
						
						game.dateTime = new Date(game.dateTime);
						game.date = new Date(game.dateTime.getFullYear(), game.dateTime.getMonth(), game.dateTime.getDate());
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
					
					$scope.scheduleDates = d3.nest()
						.key(function (game) { return game.date })
						.entries($rootScope.schedule)
						.map(function (group) {
							return {
								day: new Date(group.key),
								games: group.values
							};
						});
						
					var nextGame = $scope.scheduleDates
						.filter(function (game) { return game.day >= (new Date()) })
						.slice(0,1)[0];
					
					if (nextGame) {
						nextGame.isNext = true;
					}
					
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
	
	$scope.selectGame = function (game) {
		$rootScope.isLoading = true;
		$rootScope.selectedGame = game;
		$location.path("/game");
	};
	
});

teamApp.controller("scheduleCtl", function($rootScope, $scope, $http, $location, $mdToast, $mdDialog) {
	if (!$rootScope.managedTeam) {
		$location.path("/");
		return;
	}
	else if (!$rootScope.selectedTeam) {
		$location.path("/standings");
		return;
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
	if (!$rootScope.managedTeam) {
		$location.path("/");
		return;
	}
	else if (!$rootScope.selectedGame) {
		if ($rootScope.selectedTeam) {
			$location.path("/schedule");
		}
		else {
			$location.path("/standings");
		}
		return;
	}
	
	log.game = $scope;
	
	$scope.editGame = function () {
		$scope.isLoading = true;
		
		$mdDialog.show({
			templateUrl: "/team/editgame.html",
			controller: editGameCtl,
			locals: { game: $rootScope.selectedGame },
			clickOutsideToClose: false,
			escapeToClose: false,
			openFrom: {
				top: document.documentElement.clientHeight,
				left: 0
			},
			closeTo: {
				top: document.documentElement.clientHeight,
				left: 0
			}
		})
		.then(function () {
			$scope.isLoading = false;
		}, function () {
			$scope.isLoading = false;
		});
	};
	
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
		
		var cutOffDate = new Date($rootScope.selectedGame.gameDivision.year, 8, 1);
		
		players.forEach(function (player) {
			player.age = (player.dateOfBirth) ? Math.floor((cutOffDate - (new Date(player.dateOfBirth))) / 31536000000) : null;
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
		case "/standings":
			$location.path("/");
			break;
		case "/schedule":
			$location.path("/standings");
			break;
		
		case "/game":
			if ($rootScope.selectedTeam) {
				$location.path("/schedule");
			}
			else {
				$location.path("/standings");
			}
			break;
		}
	};
	
});