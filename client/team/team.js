/* global angular */
/* global d3 */

var teamApp = angular.module("teamApp", ["ngMaterial", "ngRoute", "ngMessages", "ngSanitize"]);

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
	.when("/evaluation", {
		templateUrl: "/team/evaluation.html",
		controller: "evaluationCtl"
	})
	.when("/draft", {
		templateUrl: "/team/draft.html",
		controller: "draftCtl"
	})
	.when("/draft2", {
		templateUrl: "/team/draft2.html",
		controller: "draft2Ctl"
	})
	.when("/email", {
		templateUrl: "/team/email.html",
		controller: "emailCtl"
	})
	.when("/depthchart", {
		templateUrl: "/team/depthchart.html",
		controller: "depthChartCtl"
	})
	.otherwise({
		templateUrl: "/team/division.html",
		controller: "divisionCtl"
	});
	
	$locationProvider.html5Mode(true);
});

teamApp.controller("divisionCtl", function($rootScope, $scope, $http, $location, $mdToast) {
	log.division = $scope;
	$rootScope.managedTeam = null;
	$rootScope.isLoading = true;
	
	$http({url: "/api/division/load"}).then(function (response) {
		$scope.divisions = response.data.divisions.sort(function (prev, curr) {
			return prev.name < curr.name ? -1 : 1;
		});
		
		var teams = response.data.teams;
		$rootScope.user = response.data.user;
		
		if ($rootScope.user) {
			$rootScope.menu.items = $rootScope.user.access.map(access => ({
				id: access,
				display: access.charAt(0).toUpperCase() + access.substr(1).toLowerCase()
			}));
		}
		
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
								return 1;
							}
							else if (prev.teamDivision.year > next.teamDivision.year) {
								return -1;
							}
							else {
								return prev.teamDivision.season > next.teamDivision.season ? 1 : -1;
							}
						})
				};
			})
			.sort(function (prev, next) { 
				return prev.name < next.name ? -1 : 1;
			});
		
		$scope.isLoading = false;
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
							name: team.name || team.coach,
							coach: team.coach,
							teamDivision: team.teamDivision,
							confrence: team.confrence || "",
							img: team.name ? "/team/media/" + team.name.toLowerCase().replace(/ /, "") + ".png" : "/team/media/blank.png",
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
	
	$scope.isLoading = true;
	$scope.team = $rootScope.selectedTeam;
	$scope.message = { text: "", active: false };
	$scope.popupPlayer = { active: false };
	
	$scope.teamSchedule = $rootScope.schedule.filter(function (game) {
		return game.awayTeam.id == $rootScope.selectedTeam.id || game.homeTeam.id == $rootScope.selectedTeam.id;
	});
	
	$http({ url: "/api/schedule/load?teamid=" + $scope.team.id }).then((response) => {
		
		$scope.players = response.data.players;
		
		var cutOffDate = new Date($rootScope.managedTeam.teamDivision.year, 8, 1);
		
		$scope.players.forEach(function (player) {
			player.age = (player.dateOfBirth) ? Math.floor((cutOffDate - (new Date(player.dateOfBirth))) / 31536000000) : null;
		});
		
		$scope.isLoading = false;
		
	}, (error) => {
		
		$scope.showMessage("error", "There was an error loading data");
		console.warn(error);
		
	});
	
	$scope.selectGame = function (game) {
		$rootScope.isLoading = true;
		$rootScope.selectedGame = game;
		$location.path("/game");
	};
	
	$scope.showMessage = (type, message) => {
		$scope.message.text = message;
		$scope.message.active = true;
		$scope.message.type = type;
		
		setTimeout(() => {
			$scope.message.active = false;
			$scope.message.text = "";
			$scope.message.type = "";
			$scope.$apply();
		}, 4000);
	};
	
	$scope.viewPlayer = player => {
		$scope.popupPlayer.player = player;
		
		if (player.height
			|| player.route
			|| player.speed
			|| player.hands
			|| player.draftBlock
			|| player.draftWatch) {
				
			player.comments = "This player " +
				(player.height == 1 ? "is short, " : "") +
				(player.height == 2 ? "is average height, " : "") +
				(player.height == 3 ? "is tall, " : "") +
				(player.hands == 1 ? "has good hands, " : "") +
				(player.hands == -1 ? "can't catch, " : "") +
				(player.speed == 1 ? "is slow, " : "") +
				(player.fast == 2 ? "is fast, " : "") +
				(player.route == 1 ? "has a sloppy route, " : "") +
				(player.route == 2 ? "has a sharp route, " : "");
			
			player.comments = player.comments.substr(0, player.comments.length - 2) + ".";
			
			if (player.draftBlock) {
				player.comments += "\r\nNot a good pickup.";
			}
			if (player.draftWatch) {
				player.comments += "\r\nGood pickup.";
			}
		}
		else {
			player.comments = "Didn't show at draft";
		}
		
		player.age = new Date(Date.now() - (new Date(player.dateOfBirth)).getTime()).getFullYear() - 1970;
		
		$scope.popupPlayer.seasons = [{
			catching: player.catching,
			draftRank: player.draftRank,
			draftRound: player.draftRound,
			runTime: player.runTime,
			running: player.running,
			season: player.playerDivision.season,
			team: player.team,
			throwing: player.throwing,
			playerDivision: player.playerDivision
		}];
		
		$scope.popupPlayer.seasons = $scope.popupPlayer.seasons.concat(player.prev
			.filter(season =>  season.draftRound )
			.sort(function (season1, season2) {
				if (season1.playerDivision.year < season2.playerDivision.year) {
					return 1;
				}
				else if (season1.playerDivision.year > season2.playerDivision.year) {
					return -1;
				}
				else {
					return season1.playerDivision.season < season2.playerDivision.season ? 1 : -1;
				}
			}));
		
		$scope.popupPlayer.active = true;
	};
	
	$scope.closePlayer = () => {
		$scope.popupPlayer.player = null;
		$scope.popupPlayer.active = false;
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
	$scope.popupPlayer = { active: false };
	
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
			return;
		}
		
		var players = response.data.players.sort(function (prev, curr) {
			if (prev.draftRank || curr.draftRank) {
				return (prev.draftPick ? prev.draftPick : 99) - (curr.draftPick ? curr.draftPick : 99);
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
	
	$http({url: "/data/player?divisionid=" + $rootScope.managedTeam.teamDivision.id + "&teamid=" + $rootScope.selectedGame.awayTeam.id}).then(httpSuccess, httpError);
	$http({url: "/data/player?divisionid=" + $rootScope.managedTeam.teamDivision.id + "&teamid=" + $rootScope.selectedGame.homeTeam.id}).then(httpSuccess, httpError);
	
	$scope.viewPlayer = player => {
		$scope.popupPlayer.player = player;
		
		if (player.height
			|| player.route
			|| player.speed
			|| player.hands
			|| player.draftBlock
			|| player.draftWatch) {
				
			player.comments = "This player " +
				(player.height == 1 ? "is short, " : "") +
				(player.height == 2 ? "is average height, " : "") +
				(player.height == 3 ? "is tall, " : "") +
				(player.hands == 1 ? "has good hands, " : "") +
				(player.hands == -1 ? "can't catch, " : "") +
				(player.speed == 1 ? "is slow, " : "") +
				(player.fast == 2 ? "is fast, " : "") +
				(player.route == 1 ? "has a sloppy route, " : "") +
				(player.route == 2 ? "has a sharp route, " : "");
			
			player.comments = player.comments.substr(0, player.comments.length - 2) + ".";
			
			if (player.draftBlock) {
				player.comments += "\r\nNot a good pickup.";
			}
			if (player.draftWatch) {
				player.comments += "\r\nGood pickup.";
			}
		}
		else {
			player.comments = "Didn't show at draft";
		}
		
		player.age = new Date(Date.now() - (new Date(player.dateOfBirth)).getTime()).getFullYear() - 1970;
		
		$scope.popupPlayer.seasons = [{
			catching: player.catching,
			draftRank: player.draftRank,
			draftRound: player.draftRound,
			runTime: player.runTime,
			running: player.running,
			season: player.playerDivision.season,
			team: player.team,
			throwing: player.throwing,
			playerDivision: player.playerDivision
		}];
		
		$scope.popupPlayer.seasons = $scope.popupPlayer.seasons.concat(player.prev
			.filter(season =>  season.draftRound )
			.sort(function (season1, season2) {
				if (season1.playerDivision.year < season2.playerDivision.year) {
					return 1;
				}
				else if (season1.playerDivision.year > season2.playerDivision.year) {
					return -1;
				}
				else {
					return season1.playerDivision.season < season2.playerDivision.season ? 1 : -1;
				}
			}));
		
		$scope.popupPlayer.active = true;
	};
	
	$scope.closePlayer = () => {
		$scope.popupPlayer.player = null;
		$scope.popupPlayer.active = false;
	};
	
});

teamApp.controller("evaluationCtl", function($rootScope, $scope, $http, $location) {
	if (!$rootScope.managedTeam) {
		$location.path("/");
		return;
	}
	
	log.eval = $scope;
	$scope.isLoading = true;
	$scope.message = { text: "", active: false };
	$scope.popup = { active: false, player: null };
	
	$http({url: "/api/eval/load?divisionid=" + $rootScope.managedTeam.teamDivision.id})
		.then(response => {
			$scope.players = response.data.players;
			
			$scope.players.forEach(player => {
				if (player.height
					|| player.route
					|| player.speed
					|| player.hands
					|| player.draftBlock
					|| player.draftWatch
					) {
					player.completed = true;
				}
				else {
					player.completed = false;
				}
			});
			
			$scope.isLoading = false;
		}, error => {
			$scope.showMessage("error", "There was an error loading data");
			console.warn("Warning", error);
		});
	
	$scope.showMessage = (type, message) => {
		$scope.message.text = message;
		$scope.message.active = true;
		$scope.message.type = type;
		
		setTimeout(() => {
			$scope.message.active = false;
			$scope.message.text = "";
			$scope.message.type = "";
			$scope.$apply();
		}, 4000);
	};
	
	$scope.selectPlayer = player => {
		$scope.popup.player = player;
		$scope.popup.active = true;
	};
	
	$scope.closePlayer = () => {
		if ($scope.popup.active) {
			$http({ url: "/api/eval/savePlayer", method: "post", data: { player: $scope.popup.player } })
				.then(response => {
					if ($scope.popup.player.height
						|| $scope.popup.player.route
						|| $scope.popup.player.speed
						|| $scope.popup.player.hands
						|| $scope.popup.player.draftBlock
						|| $scope.popup.player.draftWatch
						) {
						$scope.popup.player.completed = true;
					}
					else {
						$scope.popup.player.completed = false;
					}
					
					$scope.showMessage("info", "Player saved");
					$scope.popup.player = null;
					$scope.popup.active = false;
				}, error => {
					$scope.showMessage("error", "There was an error saving player");
					console.warn("Warning", error);
					
					$scope.popup.player = null;
					$scope.popup.active = false;
				});
		}
	};
	
	$scope.clearPlayer = () => {
		if ($scope.popup.player) {
			$scope.popup.player.height = null;
			$scope.popup.player.route = null;
			$scope.popup.player.speed = null;
			$scope.popup.player.hands = null;
			$scope.popup.player.draftBlock = null;
			$scope.popup.player.draftWatch = null;
		}
		
		$scope.closePlayer();
	};
	
});

teamApp.controller("draftCtl", function($rootScope, $scope, $http, $location) {
	if (!$rootScope.managedTeam) {
		$location.path("/");
		return;
	}
	
	log.draft = $scope;
	$scope.isLoading = true;
	$scope.activeTab = "teams";
	$scope.message = { text: "", active: false };
	$scope.popupTeam = { active: false };
	$scope.popupPlayer = { active: false };
	$scope.popupPick = { active: false };
	
	$scope.playerSort = "draftRank";
	
	$http({url: "/draft/load?divisionid=" + $rootScope.managedTeam.teamDivision.id}).then(response => {
		
		$scope.teams = response.data.teams;
		$scope.players = response.data.players;
		
		resetDraft();
		
		$scope.isLoading = false;
		
	}, error => {
		$scope.showMessage("error", "There was an error loading draft");
		console.warn("Warning", error);
		$location.path("/standings");
	});
	
	$scope.changeTab = tab => {
		$scope.activeTab = tab;
	};
	
	$scope.manageTeam = (team) => {
		$scope.popupTeam.team = team;
		$scope.popupTeam.title = team ? team.coach : "Add Team";
		
		$scope.popupTeam.active = true;
	};
	
	$scope.cancelTeam = () => {
		$scope.popupTeam.team = null;
		$scope.popupTeam.title = null;
		
		$scope.popupTeam.active = false;
		$scope.popupTeam.isLoading = false;
	};
	
	$scope.closeTeam = () => {
		$scope.popupTeam.isLoading = true;
		
		if (!$scope.popupTeam.team.id) {
			$scope.popupTeam.team.teamDivision = $rootScope.managedTeam.teamDivision;
		}
		
		$http({url: "/data/team", method: "POST", data: { team: $scope.popupTeam.team }}).then(response => {
			$scope.showMessage("info", "Team " + $scope.popupTeam.team.name + " saved");
			console.log("team " + $scope.popupTeam.team.name + " saved");
			
			$http({url: "/draft/load?divisionid=" + $rootScope.managedTeam.teamDivision.id}).then(response => {
				$scope.teams = response.data.teams;
				$scope.players = response.data.players;
				
				resetDraft();
				
				$scope.popupTeam.team = null;
				$scope.popupTeam.title = null;
				
				$scope.popupTeam.isLoading = false;
				$scope.popupTeam.active = false;
			}, error => {
				$scope.showMessage("error", "There was an error loading draft");
				console.warn("Warning", error);
				
				$scope.popupTeam.team = null;
				$scope.popupTeam.title = null;
				
				$scope.popupTeam.isLoading = false;
				$scope.popupTeam.active = false;
			});
			
		}, error => {
			$scope.showMessage("error", "There was an error saving team");
			console.warn("Warning", error);
			
			$scope.popupTeam.team = null;
			$scope.popupTeam.title = null;
			
			$scope.popupTeam.isLoading = false;
			$scope.popupTeam.active = false;
		});
	};
	
	$scope.sortPlayers = sortBy => {
		$scope.playerSort = sortBy;
	};
	
	$scope.viewPlayer = player => {
		$scope.popupPlayer.player = player;
		
		if (player.height
			|| player.route
			|| player.speed
			|| player.hands
			|| player.draftBlock
			|| player.draftWatch) {
				
			player.comments = "This player " +
				(player.height == 1 ? "is short, " : "") +
				(player.height == 2 ? "is average height, " : "") +
				(player.height == 3 ? "is tall, " : "") +
				(player.hands == 1 ? "has good hands, " : "") +
				(player.hands == -1 ? "can't catch, " : "") +
				(player.speed == 1 ? "is slow, " : "") +
				(player.fast == 2 ? "is fast, " : "") +
				(player.route == 1 ? "has a sloppy route, " : "") +
				(player.route == 2 ? "has a sharp route, " : "");
			
			player.comments = player.comments.substr(0, player.comments.length - 2) + ".";
			
			if (player.draftBlock) {
				player.comments += "\r\nNot a good pickup.";
			}
			if (player.draftWatch) {
				player.comments += "\r\nGood pickup.";
			}
		}
		else {
			player.comments = "Didn't show at draft";
		}
		
		player.age = new Date(Date.now() - (new Date(player.dateOfBirth)).getTime()).getFullYear() - 1970;
		
		$scope.popupPlayer.seasons = [{
			catching: player.catching,
			draftRank: player.draftRank,
			draftRound: player.draftRound,
			runTime: player.runTime,
			running: player.running,
			season: player.playerDivision.season,
			team: player.team,
			throwing: player.throwing,
			playerDivision: player.playerDivision
		}];
		
		$scope.popupPlayer.seasons = $scope.popupPlayer.seasons.concat(player.prev
			.filter(season =>  season.draftRound )
			.sort(function (season1, season2) {
				if (season1.playerDivision.year < season2.playerDivision.year) {
					return 1;
				}
				else if (season1.playerDivision.year > season2.playerDivision.year) {
					return -1;
				}
				else {
					return season1.playerDivision.season < season2.playerDivision.season ? 1 : -1;
				}
			}));
		
		$scope.popupPlayer.active = true;
	};
	
	$scope.closePlayer = () => {
		$scope.popupPlayer.player = null;
		$scope.popupPlayer.active = false;
	};
	
	$scope.selectPick = pick => {
		$scope.popupPick.pick = pick;
		
		if (pick.player) {
			$scope.popupPick.pickNumber = pick.player.draftNumber;
			$scope.popupPick.existingPlayer = pick.player;
		}
		else {
			$scope.popupPick.pickNumber = null;
		}
		
		$scope.popupPick.selectedError = false;
		$scope.popupPick.isLoading = false;
		$scope.popupPick.active = true;
	};
	
	$scope.pickChange = () => {
		var player = $scope.players.find(player => player.draftNumber == $scope.popupPick.pickNumber );
		
		if (player) {
			if ($scope.draftPicks.some(draftPick => draftPick.player && draftPick.player.id == player.id)) {
				$scope.popupPick.selectedError = true;
			}
			else {
				$scope.popupPick.selectedError = false;
			}
			
			$scope.popupPick.pick.player = player;
		}
		else {
			$scope.popupPick.pick.player = null;
			$scope.popupPick.selectedError = false;
		}
	};
	
	$scope.cancelPick = () => {
		$scope.popupPick.pick.player = $scope.popupPick.existingPlayer;
		
		$scope.popupPick.pickNumber = null;
		$scope.popupPick.selectedError = false;
		$scope.popupPick.pick = null;
		$scope.popupPick.existingPlayer = null;
		$scope.popupPick.isLoading = false;
		$scope.popupPick.active = false;
	};
	
	$scope.savePick = () => {
		$scope.popupPick.isLoading = true;
			
		if (($scope.popupPick.existingPlayer && !$scope.popupPick.pick.player) || ($scope.popupPick.existingPlayer && $scope.popupPick.pick.player && $scope.popupPick.existingPlayer.id != $scope.popupPick.pick.player.id)) {
			// Pick changed
			$scope.popupPick.existingPlayer.team = null;
			$scope.popupPick.existingPlayer.draftPick = null;
			
			$http({url: "/data/player", method: "POST", data: { player: $scope.popupPick.existingPlayer }}).then(response => {
				console.log("Cleared existing player");
			}, error => {
				$scope.showMessage("error", "There was an error saving existing player");
				console.warn("Warning", error);
			});
		}
		
		if ($scope.popupPick.pick.player) {
			$scope.popupPick.pick.player.team = $scope.teams.find(team => team.draftRound == $scope.popupPick.pick.roundPick );
			$scope.popupPick.pick.player.draftPick = $scope.popupPick.pick.pick;
			
			$http({url: "/data/player", method: "POST", data: { player: $scope.popupPick.pick.player }}).then(response => {
				console.log("Player " + $scope.popupPick.pick.player.firstName + " " + $scope.popupPick.pick.player.lastName + " saved");
				
				$scope.popupPick.pickNumber = null;
				$scope.popupPick.selectedError = false;
				$scope.popupPick.pick = null;
				$scope.popupPick.existingPlayer = null;
				$scope.popupPick.isLoading = false;
				$scope.popupPick.active = false;
			}, error => {
				$scope.showMessage("error", "There was an error saving pick");
				console.warn("Warning", error);
				
				$scope.popupPick.pickNumber = null;
				$scope.popupPick.selectedError = false;
				$scope.popupPick.pick = null;
				$scope.popupPick.existingPlayer = null;
				$scope.popupPick.isLoading = false;
				$scope.popupPick.active = false;
			});
		}
		else {
			$scope.popupPick.pickNumber = null;
			$scope.popupPick.selectedError = false;
			$scope.popupPick.pick = null;
			$scope.popupPick.existingPlayer = null;
			$scope.popupPick.isLoading = false;
			$scope.popupPick.active = false;
			
		}
	};
	
	function resetDraft() {
		if ($scope.teams && $scope.teams.length > 0 && $scope.players && $scope.players.length > 0) {
			$scope.rounds = Math.ceil($scope.players.length / $scope.teams.length);
			
			$scope.draftPlayers = $scope.players.filter(p => p.draftRank).length;
			$scope.hatPlayers = $scope.players.filter(p => !p.draftRank).length;
			
			$scope.draftPicks = $scope.players.map((player, index) => {
				// The pick should be the modulus of the teams. If mod returns 0 then it should be the number of teams
				var roundPick = (index + 1) % $scope.teams.length == 0 ? $scope.teams.length : (index + 1) % $scope.teams.length;
				
				return {
					pick: index + 1,
					round: Math.ceil((index + 1) / $scope.teams.length),
					roundPick: roundPick,
					team: $scope.teams.find(team => team.draftRound == roundPick),
					player: $scope.players.find(player => player.draftPick == index + 1)
				};
			});
			
		}
		else {
			$scope.draft = [];
			$scope.rounds = 1;
		}
	}
	
	$scope.showMessage = (type, message) => {
		$scope.message.text = message;
		$scope.message.active = true;
		$scope.message.type = type;
		
		setTimeout(() => {
			$scope.message.active = false;
			$scope.message.text = "";
			$scope.message.type = "";
			$scope.$apply();
		}, 4000);
	};
	
});

teamApp.controller("draft2Ctl", function($rootScope, $scope, $http, $location) {
	if (!$rootScope.managedTeam) {
		$location.path("/");
		return;
	}
	
	log.draft = $scope;
	$scope.isLoading = true;
	$scope.page = "teams";
	$scope.playerSort = "brettRank";
	
	$scope.teams = [];
	$scope.players = [];
	$scope.draftPicks = [];
	
	$scope.refreshDraft = () => {
		$http({url: "/draft/load?divisionid=" + $rootScope.managedTeam.teamDivision.id}).then(response => {
			
			const teams = response.data.teams;
			const players = response.data.players;
			
			// Update existing players
			$scope.players
				.forEach(existingPlayer => {
					const updatePlayer = players.find(newPlayer => existingPlayer.id == newPlayer.id && ((existingPlayer.draftPick !== newPlayer.draftPick) || (newPlayer.draftPick && !existingPlayer.draftTeam)));
					
					if (updatePlayer) {
						existingPlayer.draftPick = updatePlayer.draftPick;
						existingPlayer.draftTeam = $scope.teams.find(team => team.picks.some(pick => pick.player && pick.player.id == existingPlayer.id));
					}
				});
			
			// Add new players
			$scope.players = $scope.players.concat(
				players
					.filter(newPlayer => !$scope.players.some(existingPlayer => existingPlayer.id == newPlayer.id))
					.map(newPlayer => ({
						...newPlayer,
						draftTeam: $scope.teams.find(team => team.picks.some(pick => pick.player && pick.player.id == newPlayer.id)),
						prev: newPlayer.prev.sort((seasonA, seasonB) => 
							seasonA.year > seasonB.year ? -1 :
								seasonA.year < seasonB.year ? 1 :
									seasonA.season > seasonB.season ? -1 :
										seasonA.season < seasonB.season ? 1 :
											-1
						)
					}))
				);
			
			// Update existing teams
			const updateTeams = $scope.teams.filter(existingTeam => teams.some(newTeam => newTeam.id == existingTeam.id && newTeam.draftRound != existingTeam.draftRound));
			updateTeams.forEach(existingTeam => {
				const newTeam = teams.find(newTeam => newTeam.id == existingTeam.id && newTeam.draftRound != existingTeam.draftRound);
				existingTeam.draftRound = newTeam.draftRound;
				
				existingTeam.picks = new Array( Math.ceil(players.length / teams.length) )
					.fill({ })
					.map((object, index) => {
						const pick = index % 2 == 0 ? // Check for forward or backwork looking
								(index * teams.length) + newTeam.draftRound : // current round * number of picks in each round + current position looking forward
								(index * teams.length) + 1 + (teams.length - newTeam.draftRound), // current round * number of picks in each round + 1 for 0 index + number of picks in each round - current position to get backward looking
							pickPlayer = players.find(player => player.draftPick === pick);
							
						return {
							pick: pick,
							round: index + 1,
							roundPick: Math.ceil(pick / teams.length),
							player: pickPlayer,
							checkNumber: pickPlayer ? pickPlayer.draftNumber : null,
							team: newTeam
						};
					});
			});
			
			// Update Team Picks
			$scope.teams
				.flatMap(team => team.picks)
				.forEach(existingPick => {
					const pickPlayer = players.find(player => player.draftPick == existingPick.pick);
					
					if (
						(existingPick.player && pickPlayer && existingPick.player.id != pickPlayer.id) ||
						(!existingPick.player && pickPlayer) ||
						(existingPick.player && !pickPlayer)
						) {
						existingPick.player = pickPlayer;
						existingPick.checkNumber = pickPlayer ? pickPlayer.draftNumber : null;
					}
				});
			
			// Add Teams
			$scope.teams = $scope.teams.concat(
				teams
					.filter(newTeam => !$scope.teams.some(existingTeam => existingTeam.id == newTeam.id))
					.map(newTeam => ({
						...newTeam,
						picks: newTeam.draftRound ?
								new Array( Math.ceil(players.length / teams.length) )
									.fill({ })
									.map((object, index) => {
										const pick = index % 2 == 0 ? // Check for forward or backwork looking
												(index * teams.length) + newTeam.draftRound : // current round * number of picks in each round + current position looking forward
												(index * teams.length) + 1 + (teams.length - newTeam.draftRound), // current round * number of picks in each round + 1 for 0 index + number of picks in each round - current position to get backward looking
											pickPlayer = players.find(player => player.draftPick === pick);
											
										return {
											pick: pick,
											round: index + 1,
											roundPick: Math.ceil(pick / teams.length),
											player: pickPlayer,
											checkNumber: pickPlayer ? pickPlayer.draftNumber : null,
											team: newTeam
										};
									})
								: []
					}))
				);
			
			const allPicks = $scope.teams.flatMap(team => team.picks);
			
			// Add draft picks
			$scope.draftPicks = $scope.draftPicks.concat(allPicks.filter(newPick => !$scope.draftPicks.some(existingPick => existingPick.pick == newPick.pick)));
			
			$scope.isLoading = false;
			
		}, error => {
			console.warn("Warning", error);
		});
	};
	
	$scope.refreshDraft();
	const refreshInterval = setInterval($scope.refreshDraft, 6000);
	
	$scope.updateRound = (team) => {
		team.roundError = false;
		
		if (team.draftRound == "") {
			team.draftRound = null;
		}
		else if (team.draftRound < 0 || team.draftRound > $scope.teams.length) {
			team.roundError = true;
		}
		
		if ($scope.teams.some(lookupTeam => lookupTeam.id != team.id && lookupTeam.draftRound === team.draftRound)) {
			const updateTeam = $scope.teams.find(lookupTeam => lookupTeam.id != team.id && lookupTeam.draftRound === team.draftRound);
			updateTeam.draftRound = null;
			updateTeam.picks = [];
			
			$http({url: "/data/team", method: "post", data: { team: updateTeam }}).then(response => {
				//$scope.showMessage("info", "Team updated round - " + updateTeam.coach + " - " + updateTeam.draftRound);
			}, error => {
				$scope.showMessage("error", "There was an error updating team round - " + updateTeam.coach + " - " + updateTeam.draftRound);
				console.warn("Warning", error);
			});
		}
		
		if (!team.roundError) {
			
			team.picks = new Array( Math.ceil($scope.players.length / $scope.teams.length) )
				.fill({ })
				.map((object, index) => {
					const pick = index % 2 == 0 ? // Check for forward or backwork looking
							(index * $scope.teams.length) + team.draftRound : // current round * number of picks in each round + current position looking forward
							(index * $scope.teams.length) + 1 + ($scope.teams.length - team.draftRound), // current round * number of picks in each round + 1 for 0 index + number of picks in each round - current position to get backward looking
						pickPlayer = $scope.players.find(player => player.draftPick === pick);
						
					return {
						pick: pick,
						round: index + 1,
						roundPick: Math.ceil(pick / $scope.teams.length),
						player: pickPlayer,
						checkNumber: pickPlayer ? pickPlayer.draftNumber : null,
						team: team
					};
				});
			
			const teamPost = {
				...team,
				picks: []
			};
			
			$http({url: "/data/team", method: "post", data: { team: teamPost }}).then(response => {
				$scope.showMessage("info", "Team updated round - " + team.coach + " - " + team.draftRound);
			}, error => {
				$scope.showMessage("error", "There was an error updating team round - " + team.coach + " - " + team.draftRound);
				console.warn("Warning", error);
			});
		}
		
	};
	
	$scope.selectTeam = team => {
		if ($scope.selectedTeam && team.id == $scope.selectedTeam.id) {
			$scope.selectedTeam = null;
		}
		else {
			$scope.selectedTeam = team;
		}
	};
	
	$scope.selectPlayer = pick => {
		if (pick.player) {
			// Remove pick of previous player
			const prevPick = pick.player;
			prevPick.draftPick = null;
			pick.player = null;
			
			const playerSave = {
				...prevPick,
				draftTeam: null
			};
			
			$http({url: "/data/player", method: "post", data: {player: playerSave} }).then(response => {
				$scope.showMessage("info", "Removed player " + prevPick.firstName + " " + prevPick.lastName);
			}, error => {
				$scope.showMessage("error", "There was an error removing player " + prevPick.firstName + " " + prevPick.lastName);
				console.warn("Warning", error);
			});
		}
		
		pick.checkPlayer = $scope.players.find(player => player.draftNumber == pick.checkNumber);
		pick.confirm = pick.checkPlayer ? true : false;
		
		if (pick.checkPlayer && pick.checkPlayer.draftPick !== null) {
			const pickTeam = $scope.teams.find(team => team.picks.some(teamPick => teamPick.player && teamPick.player.id == pick.checkPlayer.id));
			
			if (!pickTeam) {
				pick.existingTeamError = "Already picked #" + pick.checkPlayer.draftPick;
			}
			else {
				const pickTaken = pickTeam.picks.find(teamPick => teamPick.player && teamPick.player.id == pick.checkPlayer.id);
				pick.existingTeamError = "Pick " + pickTaken.pick + " from " + pickTeam.coach;
			}
		}
	};
	
	$scope.confirmPlayer = pick => {
		if (pick.checkPlayer.draftPick) {
			const prevPick = $scope.teams
				.flatMap(team => team.picks)
				.find(teamPick => teamPick.player && teamPick.player.id == pick.checkPlayer.id);
			
			if (prevPick) {
				prevPick.player = null;
				prevPick.checkNumber = null;
				prevPick.checkPlayer = null;
			}
		}
		
		// Update pick
		pick.checkPlayer.draftPick = pick.pick;
		pick.player = pick.checkPlayer;
		
		const playerSave = {
			...pick.player,
			draftTeam: null
		};
		
		$http({url: "/data/player", method: "post", data: {player: playerSave} }).then(response => {
			$scope.showMessage("info", "Updated pick player " + (pick.player ? pick.player.firstName : "") + " " + (pick.player ? pick.player.lastName : ""));
		}, error => {
			$scope.showMessage("error", "There was an error updating pick player " + (pick.player ? pick.player.firstName : "") + " " + (pick.player ? pick.player.lastName : ""));
			console.warn("Warning", error);
		});
		
		pick.checkPlayer = null;
		pick.confirm = false;
	};
	
	$scope.declinePlayer = pick => {
		pick.checkPlayer = null;
		pick.confirm = false;
		pick.checkNumber = null;
	};
	
});

teamApp.controller("emailCtl", function($rootScope, $scope, $http, $location, $mdToast, $mdDialog, $document) {
	if (!$rootScope.managedTeam) {
		$location.path("/");
		return;
	}
	
	log.email = $scope;
	
	$scope.locations = [
		{ name: "Turner Field", address: "1114 Watertrace Dr, Fort Mill, SC 29708", mapURL: "https://goo.gl/maps/f6ni2XhJugF2" },
		{ name: "Lookout Park", address: "1965 Newberry Ln, Tega Cay, SC 29708", mapURL: "https://goo.gl/maps/PuQzsRnjsvL2" },
		{ name: "Tega Cay Elementary", address: "2185 Gold Hill Rd, Fort Mill, SC 29708", mapURL: "https://goo.gl/maps/tBSofZBq6CC2" },
		{ name: "Baxter Field", address: "3187 Colonel Springs Way, Fort Mill, SC 29708", mapURL: "https://goo.gl/maps/Ktk7HoBcN5D2" },
		{ name: "Walter Elisha Park", address: "345 N White St, Fort Mill, SC 29715", mapURL: "https://goo.gl/maps/vu8c17kgtP52" },
		{ name: "Runde Park", address: "5116 Windward Dr, Tega Cay, SC 29708", mapURL: "https://goo.gl/maps/aVmZiiuijMxoT7pT9" }
		];
	
	$http({url: "/emailer/emailload?divisionid=" + $rootScope.managedTeam.teamDivision.id + "&teamid=" + $rootScope.managedTeam.id}).then(
		function (response) {
			$scope.teamPlayers = response.data.players;
			$scope.games = response.data.games;
			$scope.parents = response.data.parents;
			$scope.emailGroups = response.data.emailLists;
			
			$scope.emails = response.data.emails.map(function (email) {
				return {
					sent: new Date(email.sent),
					to: email.to,
					toCount: email.to.length,
					subject: email.emailType.replace(/<[^>]+>/gi, ""),
					body: email.emailText
				};
			});
			
			$scope.isLoading = false;
		}, function (error) {
			console.log(error);
			
			$mdToast.show(
				$mdToast.simple()
					.textContent("There was an error loading data")
					.position("bottom left")
					.hideDelay(2000)
			);
		});
	
	$scope.gameEmail = {};
	
	$scope.templateChanged = function () {
		$http({url: "/team/emailFiles/" + $scope.selectedTemplate + ".html"}).then(
			function (response) {
				$scope.templateHTML = response.data;
				$scope.emailHTML = $scope.templateHTML;
			}, function (error) {
				console.log(error);
				
				$mdToast.show(
					$mdToast.simple()
						.textContent("There was an error loading the template")
						.position("bottom left")
						.hideDelay(2000)
				);
			});
	};
	
	$scope.changeTab = function (tab) {
		if ($scope.tab == "settings") {
			var replaceObject = $scope;
			
			if ($scope.selectedTemplate == "practice") {
				if ($scope.practiceLocation) {
					$scope.practiceLocationURL = $scope.practiceLocation.mapURL;
					$scope.practiceLocationName = $scope.practiceLocation.name;
					$scope.practiceLocationAddress = $scope.practiceLocation.address;
				}
				
				$scope.practiceDate = ($scope.practiceDateSelect) ? ($scope.practiceDateSelect.getMonth() + 1) + "/" + $scope.practiceDateSelect.getDate() + "/" + $scope.practiceDateSelect.getFullYear() : "";
				$scope.practiceStart = ($scope.practiceStartHour && $scope.practiceStartMin) ? $scope.practiceStartHour + ":" + $scope.practiceStartMin : "";
				$scope.practiceEnd = ($scope.practiceEndHour && $scope.practiceEndMin) ? $scope.practiceEndHour + ":" + $scope.practiceEndMin : "";
			}
			else if ($scope.selectedTemplate == "recap") {
				if ($scope.recap.scoreboard) {
					$scope.recap.opponentImage = $scope.recap.opponentName.toLowerCase();
					$scope.recap.huskiesScoreboard = $scope.recap.scoreboard.map(function (score) {
						return "<td>" + score.huskies + "</td>";
					}).join("");
					
					$scope.recap.opponentScoreboard = $scope.recap.scoreboard.map(function (score) {
						return "<td>" + score.opponent + "</td>";
					}).join("");
				}
				
				replaceObject = $scope.recap;
			}
			else if ($scope.selectedTemplate == "game") {
				$scope.gameEmail.teamLineup = $scope.teamPlayers
					.filter(function (player) { return player.offense && player.defense && player.group})
					.map(function (player) {
						return "<tr>" + 
								"	<td>" + player.playerNumber + "</td>" + 
								"	<td>" + player.firstName + " " + player.lastName + "</td>" + 
								"	<td>" + player.offense + "</td>" + 
								"	<td>" + player.defense + "</td>" + 
								"	<td>" + player.group + "</td>" + 
								"</tr>";
					}).join("");
					
				replaceObject = $scope.gameEmail;
			}
			
			if ($scope.selectedTemplate != "snacks" && $scope.templateHTML) {
				$scope.emailHTML = $scope.templateHTML;
				
				var replacements = $scope.emailHTML.match(/{{[^}]+}}/gi);
				
				if (replacements && replacements.length > 0) {
					replacements = replacements.map(function (replaceString) { return replaceString.replace(/[{}]/gi, "") });
				}
				
				for (var replaceIndex = 0; replaceIndex < replacements.length; replaceIndex++) {
					$scope.emailHTML = $scope.emailHTML.replace(new RegExp("{{" + replacements[replaceIndex] + "}}", "g"), (replaceObject[replacements[replaceIndex]] || ""));
				}
			}
		}
		
		if (tab == "preview") {
			var frame = document.getElementById("templateView").contentWindow.document;
			frame.open();
			frame.write($scope.emailHTML);
			frame.close();
		}
		else if (tab == "settings") {
			$scope.emailHTML = $scope.templateHTML;
		}
		
		$scope.tab = tab;
	};
	
	$scope.selectEmail = function (email) {
		email.body = email.body.replace(/cid:([^"']+)/gi, "/team/emailFiles/$1.png");
		
		$scope.emailHTML = email.body;
		$scope.selectedTabIndex = $scope.selectedTabIndex + 1;
	};
	
	$scope.send = function () {
		var emailList = [];
		
		if ($scope.selectedTemplate == "snacks") {
			emailList = $scope.parents
				.filter(function (parent) { return parent.emailGroups.indexOf("team") >= 0 && parent.playerId })
				.map(function (parent) {
					return "\"" + parent.name + "\" <" + parent.email + ">";
				});
		}
		else {
			emailList = $scope.selectedGroup.emailList;
		}
		
		var confirm = $mdDialog.confirm()
			.title("Send Email?")
			.htmlContent("Are you sure you wish to send the " + $scope.selectedTemplate + " template to<br>" + emailList.join("<br>"))
			.ariaLabel("Send Email?")
			.targetEvent(event)
			.ok("Send Email")
			.cancel("Cancel");
		
		$mdDialog.show(confirm).then(function() {
			$scope.isLoading = true;
			
			if ($scope.selectedTemplate == "snacks") {
				$scope.parents
					.filter(function (parent) { return parent.emailGroups.indexOf("team") >= 0 && parent.playerId })
					.forEach(function (parent) {
						var snackEmail = $scope.emailHTML.replace(/{{snacksLink}}/g, "http://gametime.beynum.com/snacks?emailid=" + parent._id);
						
						$http({ url: "/emailer/sendlist", method: "POST", data: { divisionid: $rootScope.managedTeam.teamDivision.id, email: snackEmail, emailList: ["\"" + parent.name + "\" <" + parent.email + ">"] }})
							.then(function (response) {
								$scope.isLoading = false;
								
								console.log("sent: " + parent.name);
								
								$mdToast.show(
									$mdToast.simple()
										.textContent("Sent to " + parent.name)
										.position("bottom left")
										.hideDelay(2000)
								);
							}, function (error) {
								$scope.isLoading = false;
								console.log(error);
								
								$mdToast.show(
									$mdToast.simple()
										.textContent("There was an error loading the emails")
										.position("bottom left")
										.hideDelay(2000)
								);
							});
						
					});
			}
			else {
				$http({url: "/emailer/sendlist", method: "POST", data: { divisionid: $rootScope.managedTeam.teamDivision.id, email: $scope.emailHTML, emailList: emailList }}).then(
					function (response) {
						$scope.isLoading = false;
						
						$mdToast.show(
							$mdToast.simple()
								.textContent("Emails sent successfully")
								.position("bottom left")
								.hideDelay(2000)
						);
					}, function (error) {
						$scope.isLoading = false;
						console.log(error);
						
						$mdToast.show(
							$mdToast.simple()
								.textContent("There was an error loading the emails")
								.position("bottom left")
								.hideDelay(2000)
						);
					});
			}
		});
			
	};
	
	$scope.addScore = function () {
		if (!$scope.recap) {
			$scope.recap = { scoreboard: [] };
		}
		else if (!$scope.recap.scoreboard) {
			$scope.recap.scoreboard = [];
		}
		
		$scope.recap.scoreboard.push({});
	};
	
	$scope.recapDateChanged = function () {
		$scope.recap.day = $scope.recap.gameDate.toLocaleDateString("us-EN", { weekday: "short" });
		$scope.recap.date = $scope.recap.gameDate.getDate();
		$scope.recap.month = $scope.recap.gameDate.getMonth() + 1;
	};
	
	$scope.gameEmailChange = function () {
		var gameTime = new Date($scope.gameEmail.selectedGame.dateTime);
		
		$scope.gameEmail.month = gameTime.getMonth() + 1;
		$scope.gameEmail.day = gameTime.toLocaleDateString("us-EN", { weekday: "short"});
		$scope.gameEmail.date = gameTime.getDate();
		$scope.gameEmail.gameTime = gameTime.toLocaleTimeString("us-EN", { hour: "2-digit", minute: "2-digit" });
		
		var arriveTime = new Date(gameTime - (30 * 60000));
		$scope.gameEmail.arriveTime = arriveTime.toLocaleTimeString("us-EN", { hour: "2-digit", minute: "2-digit" });
		
		var opponent = ($scope.gameEmail.selectedGame.homeTeam.id == $rootScope.managedTeam.id) ? $scope.gameEmail.selectedGame.awayTeam : $scope.gameEmail.selectedGame.homeTeam;
		$scope.gameEmail.opponentImage = "/emailer/images/" + opponent.name.toLowerCase() + ".png";
		$scope.gameEmail.opponent = opponent.name;
		
		var parent = $scope.parents.find(function (parent) { return parent._id == $scope.gameEmail.selectedGame.snackSignupParentId; });
		$scope.gameEmail.snackParent = (parent) ? parent.name : "";
		
	};
});

teamApp.controller("depthChartCtl", function ($rootScope, $scope, $http, $location) {
	if (!$rootScope.managedTeam) {
		$location.path("/");
		return;
	}
	
	log.depth = $scope;
	
	$scope.isLoading = true;
	$scope.team = $rootScope.managedTeam;
	$scope.selectedGame = null;
	// $scope.positions = {};
	
	$scope.positions = {
		all: [
			{ side: "offense", id: "center", name: "Center" },
			{ side: "offense", id: "leftG", name: "Left G" },
			{ side: "offense", id: "rightG", name: "Right G" },
			{ side: "offense", id: "leftWR", name: "Left WR" },
			{ side: "offense", id: "rightWR", name: "Right WR" },
			{ side: "offense", id: "rb", name: "RB" },
			{ side: "offense", id: "qb", name: "QB" },
			{ side: "defense", id: "leftC", name: "Left Corner" },
			{ side: "defense", id: "rightC", name: "Right Corner" },
			{ side: "defense", id: "leftT", name: "Left Tackle" },
			{ side: "defense", id: "tackle", name: "Tackle" },
			{ side: "defense", id: "rightT", name: "Right Tackle" },
			{ side: "defense", id: "leftLB", name: "Left LB" },
			{ side: "defense", id: "lb", name: "LB" },
			{ side: "defense", id: "rightLB", name: "Right LB" },
			{ side: "defense", id: "leftS", name: "Left Safety" },
			{ side: "defense", id: "safety", name: "Safety" },
			{ side: "defense", id: "rightS", name: "Right Safety" }
		]
	};
	
	$http({ url: "/api/depthchart/load?teamid=" + $scope.team.id }).then(response => {
		$scope.players = response.data.players;
		$scope.players.forEach(player => {
			player.depthOffenseGroup = player.depthOffenseGroup ? player.depthOffenseGroup + "" : "";
			player.depthDefenseGroup = player.depthDefenseGroup ? player.depthDefenseGroup + "" : "";
		});
		
		$scope.resetPositions();
		
		$scope.isLoading = false;
	}, error => {
		$rootScope.showMessage("error", "There was an error loading data");
		console.warn(error);
	});
	
	$scope.changePlayer = player => {
		$http({ url: "/api/depthchart/saveplayer", method: "post", data: { player: player } }).then(response => {
			console.log(response.data);
		}, error => {
			$rootScope.showMessage("error", "There was an error saving the player " + player.firstName);
			console.warn(error);
		});
		
		$scope.resetPositions();
	};
	
	$scope.resetPositions = () => {
		$scope.positions.offense = $scope.positions.all
			.filter(position => position.side == "offense")
			.map(position => ({
				name: position.name,
				id: position.id,
				players: $scope.players
					.filter(player => player.depthOffense == position.name)
					.sort((playerA, playerB) => playerA.depthOffenseGroup - playerB.depthOffenseGroup)
					.map(player => player.firstName)
			}))
			.filter(position => position.players.length > 0);
		
		$scope.positions.defense = $scope.positions.all
			.filter(position => position.side == "defense")
			.map(position => ({
				name: position.name,
				id: position.id,
				players: $scope.players
					.filter(player => player.depthDefense == position.name)
					.sort((playerA, playerB) => playerA.depthDefenseGroup - playerB.depthDefenseGroup)
					.map(player => player.firstName)
			}))
			.filter(position => position.players.length > 0);
		
		$scope.positions.offense.forEach(position => {
			$scope.positions[position.id] = position.players.join(" / ");
		});
		
		$scope.positions.all.forEach(position => {
			$scope.positions[position.id] = $scope.positions[position.side]
				.filter(side => side.id == position.id && side.players.length > 0)
				.map(side => side.players.join(" / ")).join("");
		});
		
	};
});

teamApp.controller("teamController", function ($rootScope, $scope, $http, $location, $mdToast, $mdDialog) {
	log = {root: $rootScope, team: $scope};
	log.http = $http;
	
	$rootScope.isLoading = false;
	
	$rootScope.menu = { active: false };
	$rootScope.toast = { text: "", active: false, type: "info" };
	
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

		case "/evaluation":
			$location.path("/standings");
			break;
			
		case "/draft":
			$location.path("/standings");
			break;
			
		case "/depthchart":
			$location.path("/standings");
			break;
			
		case "/email":
			$location.path("/standings");
			break;
		}
	};
	
	$scope.openMenu = (event) => {
		$rootScope.menu.active = true;
		event.stopPropagation();
		event.preventDefault();
	};
	
	$scope.closeMenu = () => {
		$rootScope.menu.active = false;
	};
	
	$scope.menuClick = (page) => {
		$location.path("/" + page);
	};
	
	$rootScope.showMessage = (type, message) => {
		$rootScope.toast.text = message;
		$rootScope.toast.active = true;
		$rootScope.toast.type = type;
		
		setTimeout(() => {
			$rootScope.toast.active = false;
			$rootScope.toast.text = "";
			$rootScope.toast.type = "info";
			$rootScope.$apply();
		}, 4000);
	};
	
});