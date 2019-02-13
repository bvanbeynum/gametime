/* global angular */
/* global d3 */

var teamApp = angular.module("teamApp", ["ngMaterial", "ngRoute", "ngMessages"]);

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
	.when("/playbook", {
		templateUrl: "/team/playbook.html",
		controller: "playbookCtl"
	})
	.when("/playmaker", {
		templateUrl: "/team/playmaker.html",
		controller: "playCtl"
	})
	.when("/draft", {
		templateUrl: "/team/draft.html",
		controller: "draftCtl"
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

teamApp.controller("playbookCtl", function($rootScope, $scope, $http, $location, $mdToast, $mdDialog) {
	if (!$rootScope.managedTeam) {
		$location.path("/");
		return;
	}
	
	$rootScope.selectedPlay = null;
	$scope.isLoading = true;
	log.playBook = $scope;
	
	$http({url: "/data/play?divisionid=" + $rootScope.managedTeam.teamDivision.id}).then(function (response) {
		$scope.plays = response.data.plays;
		$scope.isLoading = false;
	}, function (error) {
		$mdToast.show(
			$mdToast.simple()
				.textContent("There was an error loading")
				.position("bottom left")
				.hideDelay(3000)
		);
		
		console.log(error);
		$location.path("/standings");
	});
	
	$scope.openPlay = function (play) {
		if (play) {
			$rootScope.selectedPlay = play;
		}
		else {
			$rootScope.selectedPlay = {
				division: {
					id: $rootScope.managedTeam.teamDivision.id,
					name: $rootScope.managedTeam.teamDivision.name,
					year: $rootScope.managedTeam.teamDivision.year,
					season: $rootScope.managedTeam.teamDivision.season,
				},
				players: []
			};
		}
		
		$location.path("/playmaker");
	};
});

teamApp.controller("playCtl", function($rootScope, $scope, $http, $location, $mdToast, $mdDialog) {
	if (!$rootScope.managedTeam) {
		$location.path("/");
		return;
	}
	else if (!$rootScope.selectedPlay) {
		$location.path("/playbook");
		return;
	}
	
	log.playMaker = $scope;
	$scope.playData = $rootScope.selectedPlay;
	
	$scope.addMenu = function (menu, event) {
		menu.open(event);
	};
	
	$scope.modeMenu = function (menu, event) {
		menu.open(event);
	};
	
	$scope.addPlayer = function (playerType) {
		$scope.playData.players.push({ type: playerType });
		$scope.controller.refresh();
	};
	
	$scope.changeMode = function (newMode) {
		$scope.controller.lineMode = newMode;
	};
	
	$scope.save = function () {
		if (!$scope.playForm.$invalid) {
			$scope.isLoading = true;
			
			var savePlay = {
				id: $scope.playData.id,
				division: $scope.playData.division,
				name: $scope.playData.name,
				scrimageLine: $scope.playData.scrimageLine,
				players: $scope.playData.players.map(function (player) {
					return {
						type: player.type,
						location: player.location,
						route: player.route
					};
				})
			};
			
			$http({url: "/data/play", method: "POST", data: { play: savePlay }}).then(
				function (response) {
					$rootScope.selectedPlay = null;
					$location.path("/playbook");
				}, function (error) {
					$scope.isLoading = false;
					
					console.log(error);
					
					$mdToast.show(
						$mdToast.simple()
							.textContent("There was an error saving the play")
							.position("bottom left")
							.hideDelay(3000)
					);
				});
		}
		else {
			$mdToast.show(
				$mdToast.simple()
					.textContent("Must enter a name for the play")
					.position("bottom left")
					.hideDelay(3000)
			);
		}
	};
	
	$scope.cancel = function () {
		$rootScope.selectedPlay = null;
		$location.path("/playbook");
	};
	
	$scope.delete = function (event) {
		
		$mdDialog.show($mdDialog.confirm()
			.title("Confirm Delete")
			.textContent("Are you sure you want to delete the play?")
			.ariaLabel("Confirm Delete")
			.targetEvent(event)
			.ok("Delete")
			.cancel("Cancel")
		)
		.then(function () {
			$scope.isLoading = true;
			
			$http({url: "/data/play?id=" + $scope.playData.id, method: "DELETE"}).then(
				function (response) {
					
					$scope.isLoading = false;
					$rootScope.selectedPlay = null;
					$location.path("/playbook");
					
				}, function (error) {
					
					$scope.isLoading = false;
					console.log(error);
					
					$mdToast.show(
						$mdToast.simple()
							.textContent("There was an error deleting the play")
							.position("bottom left")
							.hideDelay(3000)
					);
					
				});
		}, function () {
			// Cancel
		});
		
	};
	
});

teamApp.controller("draftCtl", function($rootScope, $scope, $http, $location, $mdToast, $mdDialog) {
	if (!$rootScope.managedTeam) {
		$location.path("/");
		return;
	}
	
	log.draft = $scope;
	$scope.isLoading = true;
	
	$scope.playerSort = "draftRank";
	
	$http({url: "/draft/load?divisionid=" + $rootScope.managedTeam.teamDivision.id}).then(function (response) {
		
		$scope.teams = response.data.teams;
		$scope.players = response.data.players;
		
		initializeDraft();
		
		$scope.isLoading = false;
		
	}, function (error) {
		$mdToast.show(
			$mdToast.simple()
				.textContent("There was an error loading")
				.position("bottom left")
				.hideDelay(3000)
		);
		
		console.log(error);
		$location.path("/standings");
	});
	
	function initializeDraft() {
		if ($scope.teams && $scope.teams.length > 0 && $scope.players && $scope.players.length > 0) {
			$scope.rounds = Math.ceil($scope.players.length / $scope.teams.length);
			
			$scope.draft = $scope.players.map(function (player, index) {
				var round = Math.ceil((index + 1) / $scope.teams.length),
					teamPick = Math.ceil((index + 1) / $scope.teams.length) % 2 == 0 ?
						($scope.teams.length + 1) - (((index + 1) % $scope.teams.length) != 0 ? (index + 1) % $scope.teams.length : 10) :
						((index + 1) % $scope.teams.length) != 0 ? (index + 1) % $scope.teams.length : 10,
					pickTeam = $scope.teams.find(function (team) {
						return team.draftRound == teamPick;
					}),
					pickPlayer = $scope.players.find(function (player) {
						return player.draftPick == index + 1;
					});
				
				return {
					round: round,
					pick: index + 1,
					teamPick: teamPick,
					team: pickTeam,
					player: pickPlayer
				};
			});
		}
		else {
			$scope.draft = [];
			$scope.rounds = 1;
		}
	}
	
	$scope.selectPick = function (pick) {
		$mdDialog.show({
			templateUrl: "/team/draftpick.html",
			controller: pickPlayerCtl,
			locals: { pick: pick, players: $scope.players, draft: $scope.draft },
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
		.then(function (player) {
			if (player) {
				player.draftPick = pick.pick;
				pick.player = player;
				
				player.team = $scope.teams.find(function (team) {
					return team.draftRound == pick.teamPick;
				});
				
				$http({url: "/data/player", method: "POST", data: { player: player }}).then(
					function (response) {
						console.log("Player " + player.firstName + " " + player.lastName + " saved");
					}, function (error) {
						console.log(error);
						
						$mdToast.show(
							$mdToast.simple()
								.textContent("There was an error saving the team")
								.position("bottom left")
								.hideDelay(2000)
						);
					});
			}
			else if (pick.player) {
				player = pick.player;
				player.draftPick = null;
				player.team = null;
				
				$http({url: "/data/player", method: "POST", data: { player: player }}).then(
					function (response) {
						pick.player = null;
						console.log("Player " + player.firstName + " " + player.lastName + " removed");
					}, function (error) {
						console.log(error);
						
						$mdToast.show(
							$mdToast.simple()
								.textContent("There was an error saving the team")
								.position("bottom left")
								.hideDelay(2000)
						);
					});
			}
			
		});
	};
	
	$scope.manageTeam = function (team) {
		$mdDialog.show({
			templateUrl: "/team/draftteam.html",
			controller: teamManageCtl,
			locals: { team: team, allTeams: $scope.teams },
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
		.then(function (team) {
			if (!team.id) {
				team.teamDivision = $rootScope.managedTeam.teamDivision;
				$scope.teams.push(team);
				initializeDraft();
			}
			else {
				$scope.draft.forEach(function (pick) {
					pick.team = $scope.teams.find(function (team) { return team.draftRound == pick.teamPick; });
				});
			}
			
			$http({url: "/data/team", method: "POST", data: { team: team }}).then(
				function (response) {
					team.id = response.data.teamId;
					
					console.log("team " + team.name + " saved");
				}, function (error) {
					console.log(error);
					
					$mdToast.show(
						$mdToast.simple()
							.textContent("There was an error saving the team")
							.position("bottom left")
							.hideDelay(2000)
					);
				});
		});
	};
	
	$scope.viewPlayer = function (player) {
		$mdDialog.show({
			templateUrl: "/team/draftplayer.html",
			controller: viewPlayerCtl,
			locals: { player: player },
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
		});
	};
	
	$scope.sortPlayers = function (sortBy) {
		$scope.playerSort = sortBy;
	};
	
});

function teamManageCtl(team, allTeams, $scope, $mdDialog, $mdToast) {
	if (team) {
		$scope.editType = "Manage";
	}
	else {
		team = {};
		$scope.editType = "Add";
	}
	
	$scope.team = team;
	
	$scope.close = function () {
		var dupTeams = allTeams.filter(function (allTeam) { return allTeam.id != $scope.team.id && $scope.team.draftRound && allTeam.draftRound == $scope.team.draftRound });
		
		if ($scope.team.name.length == 0) {
			$scope.errorMessage = "You must enter a team name";
		}
		else if (dupTeams.length > 0) {
			$scope.errorMessage = "Round already taken: " + dupTeams
				.map(function (team) { return team.name })
				.join(", ");
		}
		else {
			$mdDialog.hide($scope.team);
		}
	};
}

function pickPlayerCtl(pick, players, draft, $scope, $mdDialog) {
	$scope.player = pick.player;
	
	if ($scope.player) {
		$scope.playerNumber = $scope.player.draftNumber;
		$scope.playerName = $scope.player.firstName + " " + $scope.player.lastName;
	}
	
	$scope.pickChange = function () {
		var player = players.find(function (player) { return player.draftNumber == $scope.playerNumber; });
		
		$scope.isSelected = false;
		$scope.errorMessage = null;

		if (player && draft.some(function (draftPick) { return draftPick.player && draftPick.player.id == player.id })) {
			$scope.isSelected = true;
			$scope.errorMessage = "Player is already selected";
		}
		if (player) {
			$scope.player = player;
			$scope.playerName = player.firstName + " " + player.lastName;
		}
		else {
			$scope.player = null;
			$scope.playerName = null;
		}
	};
	
	$scope.close = function () {
		if (!$scope.isSelected) {
			$mdDialog.hide($scope.player);
		}
	};
}

function viewPlayerCtl(player, $scope, $mdDialog) {
	$scope.player = player;
	
	$scope.age = new Date(Date.now() - (new Date(log.draft.players[0].dateOfBirth)).getTime()).getFullYear() - 1970;
	$scope.seasons = player.prev
		.filter(function (season) { return season.round })
		.sort(function (season1, season2) {
			if (season1.year < season2.year) {
				return -1;
			}
			else if (season1.year > season2.year) {
				return 1;
			}
			else {
				return season1.season < season2.season ? -1 : 1;
			}
		});
	
	$scope.seasons.unshift({
		catching: player.catching,
		rank: player.draftRank,
		round: player.draftRound,
		runTime: player.runTime,
		running: player.running,
		season: "spring",
		team: "",
		throwing: player.throwing,
		year: 2019
	});
	
	$scope.close = function () {
		$mdDialog.hide();
	};
}

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
		
		case "/playbook":
			$location.path("/standings");
			break;
		
		case "/playmaker":
			$location.path("/playbook");
			break;
		
		case "/draft":
			$location.path("/standings");
			break;
		}
	};
	
	$scope.openMenu = function ($mdMenu, event) {
		$mdMenu.open(event);
	};
	
	$scope.openPlaybook = function () {
		$location.path("/playbook");
	};
	
	$scope.openDraft = function () {
		$location.path("/draft");
	};
	
});