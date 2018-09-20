var mongoose = require("mongoose"),
	data = require("./datamodels");

module.exports = function (app) {
	
	app.get("/data/player", (request, response) => {
		var validQueries = "|division|id|teamid|teamname|name|";
		if (Object.keys(request.query).length > 0) {
			var invalidQuery = Object.keys(request.query).filter((query) => {
				return validQueries.indexOf("|" + query + "|") < 0;
			});
			
			if (invalidQuery.length > 0) {
				response.status(500).json({error: "Invalid query terms: " + invalidQuery.join(", ")});
				return;
			}
		}
		
		var filter = {};
		
		if (request.query.division) {
			filter.division = request.query.division;
		}
		if (request.query.id) {
			filter._id = request.query.id;
		}
		if (request.query.teamid) {
			filter["team.id"] = request.query.teamid;
		}
		if (request.query.teamname) {
			filter["team.name"] = { $regex: new RegExp(request.query.teamname, "i") };
		}
		if (request.query.name) {
			filter.$or = [
				{ firstName: { $regex: new RegExp(request.query.name, "i") }},
				{ lastName: { $regex: new RegExp(request.query.name, "i") }}
				];
		}
		
		data.player.find(filter)
			.exec()
			.then((playersDb) => {
				var players = playersDb.map((playerDb) => {
					return {
						id: playerDb._id,
						division: playerDb.division,
						draftNumber: playerDb.draftNumber,
						team: (playerDb.team) ? { id: playerDb.team.id, name: playerDb.team.name } : null,
						draftRound: playerDb.draftRound,
						draftRank: playerDb.draftRank,
						firstName: playerDb.firstName,
						lastName: playerDb.lastName,
						dateOfBirth: playerDb.dateOfBirth,
						parentName: playerDb.parentName,
						parentEmail: playerDb.parentEmail,
						Phone: playerDb.Phone,
						shirtSize: playerDb.shirtSize,
						requests: playerDb.requests,
						coachRequest: playerDb.coachRequest,
						coachProtect: playerDb.coachProtect,
						recThrowing: playerDb.recThrowing,
						recCatching: playerDb.recCatching,
						throwing: playerDb.throwing,
						catching: playerDb.catching,
						running: playerDb.running,
						runTime: playerDb.runTime,
						spring2018: (playerDb.spring2018) ? {
							division: playerDb.spring2018.division,
							recRank: playerDb.spring2018.recRank,
							coachProtect: playerDb.spring2018.coachProtect,
							coachRequest: playerDb.spring2018.coachRequest,
							team: playerDb.spring2018.team,
							throwing: playerDb.spring2018.throwing,
							catching: playerDb.spring2018.catching,
							running: playerDb.spring2018.running,
							runTime: playerDb.spring2018.runTime
						} : null
					};
				});
				
				response.status(200).json({players: players});
			})
			.catch((error) => {
				response.status(500).json({error: error.message});
			});
		
	});
	
	app.post("/data/player", (request, response) => {
		if (!request.body.player) {
			response.status(500).json({error: "Invalid player save request" });
		}
		
		var playerSave = request.body.player;
		
		if (playerSave.id) {
			data.player.findById(playerSave.id)
				.exec()
				.then((playerDb) => {
					
					if (!playerDb) {
						throw new Error("Player not found");
					}
					
					playerDb.division = playerSave.division ? playerSave.division : playerDb.division;
					playerDb.draftNumber = playerSave.draftNumber ? playerSave.draftNumber : playerDb.draftNumber;
					playerDb.team = (playerSave.team) ? { id: playerSave.team.id, name: playerSave.team.name } : playerDb.team;
					playerDb.draftRound = playerSave.draftRound ? playerSave.draftRound : playerDb.draftRound;
					playerDb.draftRank = playerSave.draftRank ? playerSave.draftRank : playerDb.draftRank;
					playerDb.firstName = playerSave.firstName ? playerSave.firstName : playerDb.firstName;
					playerDb.lastName = playerSave.lastName ? playerSave.lastName : playerDb.lastName;
					playerDb.dateOfBirth = playerSave.dateOfBirth ? playerSave.dateOfBirth : playerDb.dateOfBirth;
					playerDb.parentName = playerSave.parentName ? playerSave.parentName : playerDb.parentName;
					playerDb.parentEmail = playerSave.parentEmail ? playerSave.parentEmail : playerDb.parentEmail;
					playerDb.Phone = playerSave.Phone ? playerSave.Phone : playerDb.Phone;
					playerDb.shirtSize = playerSave.shirtSize ? playerSave.shirtSize : playerDb.shirtSize;
					playerDb.requests = playerSave.requests ? playerSave.requests : playerDb.requests;
					playerDb.coachRequest = playerSave.coachRequest ? playerSave.coachRequest : playerDb.coachRequest;
					playerDb.coachProtect = playerSave.coachProtect ? playerSave.coachProtect : playerDb.coachProtect;
					playerDb.recThrowing = playerSave.recThrowing ? playerSave.recThrowing : playerDb.recThrowing;
					playerDb.recCatching = playerSave.recCatching ? playerSave.recCatching : playerDb.recCatching;
					playerDb.throwing = playerSave.throwing ? playerSave.throwing : playerDb.throwing;
					playerDb.catching = playerSave.catching ? playerSave.catching : playerDb.catching;
					playerDb.running = playerSave.running ? playerSave.running : playerDb.running;
					playerDb.runTime = playerSave.runTime ? playerSave.runTime : playerDb.runTime;
					playerDb.spring2018 = (playerSave.spring2018) ? {
						division: playerSave.spring2018.division ? playerSave.spring2018.division : playerDb.spring2018.division,
						recRank: playerSave.spring2018.recRank ? playerSave.spring2018.recRank : playerDb.spring2018.recRank,
						coachProtect: playerSave.spring2018.coachProtect ? playerSave.spring2018.coachProtect : playerDb.spring2018.coachProtect,
						coachRequest: playerSave.spring2018.coachRequest ? playerSave.spring2018.coachRequest : playerDb.spring2018.coachRequest,
						team: playerSave.spring2018.team ? playerSave.spring2018.team : playerDb.spring2018.team,
						throwing: playerSave.spring2018.throwing ? playerSave.spring2018.throwing : playerDb.spring2018.throwing,
						catching: playerSave.spring2018.catching ? playerSave.spring2018.catching : playerDb.spring2018.catching,
						running: playerSave.spring2018.running ? playerSave.spring2018.running : playerDb.spring2018.running,
						runTime: playerSave.spring2018.runTime ? playerSave.spring2018.runTime : playerDb.spring2018.runTime
					} : playerDb.spring2018;
					
					return playerDb.save();
				})
				.then((playerDb) => {
					response.status(200).json({ playerId: playerDb._id });
				})
				.catch((error) => {
					console.log(error.message);
					response.status(500).json({ error: error.message });
				});
		}
		else {
			
			new data.player({
				division: playerSave.division,
				draftNumber: playerSave.draftNumber,
				team: (playerSave.team) ? { id: playerSave.team.id, name: playerSave.team.name } : null,
				draftRound: playerSave.draftRound,
				draftRank: playerSave.draftRank,
				firstName: playerSave.firstName,
				lastName: playerSave.lastName,
				dateOfBirth: playerSave.dateOfBirth,
				parentName: playerSave.parentName,
				parentEmail: playerSave.parentEmail,
				Phone: playerSave.Phone,
				shirtSize: playerSave.shirtSize,
				requests: playerSave.requests,
				coachRequest: playerSave.coachRequest,
				coachProtect: playerSave.coachProtect,
				recThrowing: playerSave.recThrowing,
				recCatching: playerSave.recCatching,
				throwing: playerSave.throwing,
				catching: playerSave.catching,
				running: playerSave.running,
				runTime: playerSave.runTime,
				spring2018: (playerSave.spring2018) ? {
					division: playerSave.spring2018.division,
					recRank: playerSave.spring2018.recRank,
					coachProtect: playerSave.spring2018.coachProtect,
					coachRequest: playerSave.spring2018.coachRequest,
					team: playerSave.spring2018.team,
					throwing: playerSave.spring2018.throwing,
					catching: playerSave.spring2018.catching,
					running: playerSave.spring2018.running,
					runTime: playerSave.spring2018.runTime
				} : null
			})
			.save()
			.then((playerDb) => {
				response.status(200).json({ playerId: playerDb._id });
			})
			.catch((error) => {
				response.status(500).json({ error: error.message });
			});
			
		}
	});
	
	app.delete("/data/player", (request, response) => {
		var validQueries = "|division|id|teamid|teamname|name|";
		if (Object.keys(request.query).length > 0) {
			var invalidQuery = Object.keys(request.query).filter((query) => {
				return validQueries.indexOf("|" + query + "|") < 0;
			});
			
			if (invalidQuery.length > 0) {
				response.status(500).json({error: "Invalid query terms: " + invalidQuery.join(", ")});
				return;
			}
		}
		
		var filter = {};
		
		if (request.query.division) {
			filter.division = request.query.division;
		}
		if (request.query.id) {
			filter._id = request.query.id;
		}
		if (request.query.teamid) {
			filter["team.id"] = request.query.teamId;
		}
		if (request.query.teamname) {
			filter["team.name"] = { $regex: new RegExp(request.query.teamname, "i") };
		}
		if (request.query.name) {
			filter.$or = [
				{ firstName: { $regex: new RegExp(request.query.name, "i") }},
				{ lastName: { $regex: new RegExp(request.query.name, "i") }}
				];
		}
		
		data.player.deleteMany(filter)
			.then(() => {
				response.status(200).json({status: "ok"});
			})
			.catch((error) => {
				response.status(500).json({error: error.message});
			});
	});
	
	app.get("/data/team", (request, response) => {
		var validQueries = "|id|name|division|";
		if (Object.keys(request.query).length > 0) {
			var invalidQuery = Object.keys(request.query).filter((query) => {
				return validQueries.indexOf("|" + query + "|") < 0;
			});
			
			if (invalidQuery.length > 0) {
				response.status(500).json({error: "Invalid query terms: " + invalidQuery.join(", ")});
				return;
			}
		}
		
		var filter = {};
		
		if (request.query.id) {
			filter._id = request.query.id;
		}
		if (request.query.name) {
			filter.name = { $regex: new RegExp(request.query.name, "i") };
		}
		if (request.query.division) {
			filter.division = request.query.division;
		}
		
		data.team.find(filter)
			.exec()
			.then((teamsDb) => {
				var teams = teamsDb.map((teamDb) => {
					return {
						id: teamDb._id,
						name: teamDb.name,
						division: teamDb.division,
						confrence: teamDb.confrence,
						coach: teamDb.coach,
						wins: teamDb.wins,
						losses: teamDb.losses
					};
				});
				
				response.status(200).json({teams: teams});
			})
			.catch((error) => {
				response.status(500).json({error: error.message});
			});
	});
	
	app.post("/data/team", (request, response) => {
		if (!request.body.team || !request.body.team.name) {
			response.status(500).json({error: "Invalid team save request" });
		}
		
		var teamSave = request.body.team;
		
		if (teamSave.id) {
			data.team.findById(teamSave.id)
				.exec()
				.then((teamDb) => {
					if (!teamDb) {
						throw new Error("Team is not found");
					}
					
					teamDb.name = teamSave.name ? teamSave.name : teamDb.name;
					teamDb.division = teamSave.division ? teamSave.division : teamDb.division;
					teamDb.confrence = teamSave.confrence ? teamSave.confrence : teamDb.confrence;
					teamDb.coach = teamSave.coach ? teamSave.coach : teamDb.coach;
					teamDb.wins = teamSave.wins ? teamSave.wins : teamDb.wins;
					teamDb.losses = teamSave.losses ? teamSave.losses : teamDb.losses;
					
					return teamDb.save();
				})
				.then((teamDb) => {
					response.status(200).json({ teamId: teamDb._id });
				})
				.catch((error) => {
					response.status(500).json({ error: error.message });
				});
		}
		else {
			
			new data.team({
				name: teamSave.name,
				division: teamSave.division,
				confrence: teamSave.confrence,
				coach: teamSave.coach,
				wins: teamSave.wins,
				losses: teamSave.losses
			})
			.save()
			.then((teamDb) => {
				response.status(200).json({ teamId: teamDb._id });
			})
			.catch((error) => {
				response.status(500).json({ error: error.message });
			});
			
		}
		
	});
	
	app.delete("/data/team", (request, response) => {
		var validQueries = "|id|name|division|";
		if (Object.keys(request.query).length > 0) {
			var invalidQuery = Object.keys(request.query).filter((query) => {
				return validQueries.indexOf("|" + query + "|") < 0;
			});
			
			if (invalidQuery.length > 0) {
				response.status(500).json({error: "Invalid query terms: " + invalidQuery.join(", ")});
				return;
			}
		}
		
		var filter = {};
		
		if (request.query.id) {
			filter._id = request.query.id;
		}
		if (request.query.name) {
			filter.name = { $regex: new RegExp(request.query.name, "i") };
		}
		if (request.query.division) {
			filter.division = request.query.division;
		}
		
		data.team.deleteMany(filter)
			.then(() => {
				response.status(200).json({status: "ok"});
			})
			.catch((error) => {
				response.status(500).json({error: error.message});
			});
	});
	
	app.get("/data/game", (request, response) => {
		var validQueries = "|date|division|teamid|teamname|";
		if (Object.keys(request.query).length > 0) {
			var invalidQuery = Object.keys(request.query).filter((query) => {
				return validQueries.indexOf("|" + query + "|") < 0;
			});
			
			if (invalidQuery.length > 0) {
				response.status(500).json({error: "Invalid query terms: " + invalidQuery.join(", ")});
				return;
			}
		}
		
		var filter = {};
		
		if (request.query.date) {
			var day = new Date(Date.parse(request.query.date)),
				endDate = new Date(day);
			
			endDate.setDate(day.getDate() + 1);
			filter.dateTime = { $gte: Date.parse(request.query.date), $lt: endDate };
		}
		if (request.query.division) {
			filter.division = request.query.division;
		}
		if (request.query.teamid) {
			filter.$or = [
				{ "homeTeam.id": request.query.id },
				{ "awayTeam.id": request.query.id }
				];
		}
		if (request.query.teamname) {
			filter.$or = [
				{ "homeTeam.name": { $regex: new RegExp(request.query.teamname, "i") } },
				{ "awayTeam.name": { $regex: new RegExp(request.query.teamname, "i") } }
				];
		}
		
		data.game.find(filter)
			.exec()
			.then((gamesDb) => {
				var games = gamesDb.map((gameDb) => {
					return {
						id: gameDb._id,
						dateTime: gameDb.dateTime,
						division: gameDb.division,
						field: gameDb.field,
						homeTeam: (gameDb.homeTeam) ? {
							id: gameDb.homeTeam.id,
							name: gameDb.homeTeam.name,
							score: gameDb.homeTeam.score,
							isWinner: gameDb.homeTeam.isWinner
						} : null,
						awayTeam: (gameDb.awayTeam) ? {
							id: gameDb.awayTeam.id,
							name: gameDb.awayTeam.name,
							score: gameDb.awayTeam.score,
							isWinner: gameDb.awayTeam.isWinner
						} :null
					};
				});
				
				response.status(200).json({games: games});
			})
			.catch((error) => {
				response.status(500).json({error: error.message});
			});
	});
	
	app.post("/data/game", (request, response) => {
		if (!request.body.game || !request.body.game.dateTime || !request.body.game.homeTeam || !request.body.game.awayTeam) {
			response.status(500).json({ error: "Invalid game save request"});
		}
		
		var gameSave = request.body.game;
		
		if (gameSave.id) {
			data.game.findById(gameSave.id)
				.exec()
				.then((gameDb) => {
					if (!gameDb) {
						throw new Error("Game can't be found");
					}
					
					gameDb.division = gameSave.division ? gameSave.division : gameDb.division;
					gameDb.dateTime = gameSave.dateTime ? gameSave.dateTime : gameDb.dateTime;
					gameDb.field = gameSave.field ? gameSave.field : gameDb.field;
					gameDb.homeTeam = gameSave.homeTeam ? {
						id: gameSave.homeTeam.id,
						name: gameSave.homeTeam.name,
						score: gameSave.homeTeam.score ? gameSave.homeTeam.score : gameDb.homeTeam ? gameDb.homeTeam.score : null,
						isWinner: gameSave.homeTeam.isWinner ? gameSave.homeTeam.isWinner : gameDb.homeTeam ? gameDb.homeTeam.isWinner : null
					} : gameDb.homeTeam;
					gameDb.awayTeam = gameSave.awayTeam ? {
						id: gameSave.awayTeam.id,
						name: gameSave.awayTeam.name,
						score: gameSave.awayTeam.score ? gameSave.awayTeam.score : gameDb.awayTeam ? gameDb.awayTeam.score : null,
						isWinner: gameSave.awayTeam.isWinner ? gameSave.awayTeam.isWinner : gameDb.awayTeam ? gameDb.awayTeam.isWinner : null
					} : gameDb.awayTeam;
					
					return gameDb.save();
				})
				.then((gameDb) => {
					response.status(200).json({ gameId: gameDb._id });
				})
				.catch((error) => {
					response.status(500).json({ error: error.message });
				});
		}
		else {
			
			new data.game({
				division: gameSave.division,
				dateTime: gameSave.dateTime,
				field: gameSave.field,
				homeTeam: gameSave.homeTeam ? {
					id: gameSave.homeTeam.id,
					name: gameSave.homeTeam.name,
					score: gameSave.homeTeam.score,
					isWinner: gameSave.homeTeam.isWinner
				} : null,
				awayTeam: gameSave.awayTeam ? {
					id: gameSave.awayTeam.id,
					name: gameSave.awayTeam.name,
					score: gameSave.awayTeam.score,
					isWinner: gameSave.awayTeam.isWinner
				} : null
			})
			.save()
			.then((gameDb) => {
				response.status(200).json({ gameId: gameDb._id });
			})
			.catch((error) => {
				response.status(500).json({ error: error.message });
			});
			
		}
	});
	
	app.delete("/data/game", (request, response) => {
		var validQueries = "|date|division|teamid|teamname|";
		if (Object.keys(request.query).length > 0) {
			var invalidQuery = Object.keys(request.query).filter((query) => {
				return validQueries.indexOf("|" + query + "|") < 0;
			});
			
			if (invalidQuery.length > 0) {
				response.status(500).json({error: "Invalid query terms: " + invalidQuery.join(", ")});
				return;
			}
		}
		
		var filter = {};
		
		if (request.query.date) {
			var day = new Date(Date.parse(request.query.date)),
				endDate = new Date(day);
			
			endDate.setDate(day.getDate() + 1);
			filter.dateTime = { $gte: Date.parse(request.query.date), $lt: endDate };
		}
		if (request.query.division) {
			filter.division = request.query.division;
		}
		if (request.query.teamid) {
			filter.$or = [
				{ "homeTeam.id": request.query.id },
				{ "awayTeam.id": request.query.id }
				];
		}
		if (request.query.teamname) {
			filter.$or = [
				{ "homeTeam.name": { $regex: new RegExp(request.query.teamname, "i") } },
				{ "awayTeam.name": { $regex: new RegExp(request.query.teamname, "i") } }
				];
		}
		
		data.game.deleteMany(filter)
			.then(() => {
				response.status(200).json({status: "ok"});
			})
			.catch((error) => {
				response.status(500).json({error: error.message});
			});
	});
	
};