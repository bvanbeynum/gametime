var data = require("./datamodels");
var webRequest = require("request");

module.exports = function (app) {
	
	app.get("/data/division", (request, response) => {
		var validQueries = "|divisionid|";
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
		
		if (request.query.divisionid) {
			filter._id = request.query.divisionid;
		}
		
		data.division.find(filter)
			.exec()
			.then((divisionsDb) => {
				var divisions = divisionsDb.map((divisionDb) => {
					return {
						id: divisionDb._id,
						name: divisionDb.name,
						year: divisionDb.year,
						season: divisionDb.season,
						restricted: divisionDb.restricted
					};
				});
				
				response.status(200).json({divisions: divisions});
			})
			.catch((error) => {
				response.status(500).json({error: error.message});
			});
	});
	
	app.post("/data/division", (request, response) => {
		if (!request.body.division) {
			response.status(500).json({error: "Invalid division save request" });
			return;
		}
		
		var divisionSave = request.body.division;
		divisionSave.id = divisionSave._id || divisionSave.id;
		
		if (divisionSave.id) {
			data.team.findById(divisionSave.id)
				.exec()
				.then((divisionDb) => {
					if (!divisionDb) {
						throw new Error("Division is not found");
					}
					
					divisionDb.name = divisionSave.name ? divisionSave.name : divisionDb.name;
					divisionDb.year = divisionSave.year ? divisionSave.year : divisionDb.year;
					divisionDb.season = divisionSave.season ? divisionSave.season : divisionDb.season;
					divisionDb.restricted = divisionSave.restricted ? divisionSave.restricted : divisionDb.restricted;
					
					return divisionDb.save();
				})
				.then((divisionDb) => {
					response.status(200).json({ divisionId: divisionDb._id });
				})
				.catch((error) => {
					response.status(500).json({ error: error.message });
				});
		}
		else {
			
			new data.division({
				name: divisionSave.name,
				year: divisionSave.year,
				season: divisionSave.season,
				restricted: divisionSave.restricted
			})
			.save()
			.then((divisionDb) => {
				response.status(200).json({ divisionId: divisionDb._id });
			})
			.catch((error) => {
				response.status(500).json({ error: error.message });
			});
			
		}
		
	});
	
	app.delete("/data/division", (request, response) => {
		if (!request.query.divisionid) {
			response.status(500).json({error: "Invalid delete request"});
			return;
		}
		
		var filter = { _id: request.query.divisionid };
		
		data.division.deleteOne(filter)
			.then(() => {
				response.status(200).json({status: "ok"});
			})
			.catch((error) => {
				response.status(500).json({error: error.message});
			});
	});
	
	app.get("/data/player", (request, response) => {
		var validQueries = "|division|divisionid|id|teamid|teamname|name|";
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
			filter["playerDivision.name"] = request.query.division;
			filter["playerDivision.year"] = 2018;
			filter["playerDivision.season"] = "fall";
		}
		if (request.query.divisionid) {
			filter["playerDivision.id"] = request.query.divisionid;
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
						playerDivision: playerDb.playerDivision ? {
							id: playerDb.playerDivision.id,
							name: playerDb.playerDivision.name,
							year: playerDb.playerDivision.year,
							season: playerDb.playerDivision.season
						}: null,
						division: playerDb.division,
						team: (playerDb.team) ? { id: playerDb.team.id, name: playerDb.team.name } : null,
						
						draftNumber: playerDb.draftNumber,
						draftRound: playerDb.draftRound,
						draftRank: playerDb.draftRank,
						brettRank: playerDb.brettRank,
						draftPick: playerDb.draftPick,
						
						firstName: playerDb.firstName,
						lastName: playerDb.lastName,
						playerNumber: playerDb.playerNumber,
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
						height: playerDb.height,
						route: playerDb.route,
						speed: playerDb.speed,
						hands: playerDb.hands,
						draftBlock: playerDb.draftBlock,
						draftWatch: playerDb.draftWatch,
						notes: playerDb.notes,
						
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
						} : null,
						prev: playerDb.prev ? playerDb.prev.map((prev) => {
							return {
								year: prev.year,
								season: prev.season,
								division: prev.division,
								rank: prev.rank,
								round: prev.round,
								coachProtect: prev.coachProtect,
								coachRequest: prev.coachRequest,
								team: prev.team,
								throwing: prev.throwing,
								catching: prev.catching,
								running: prev.running,
								runTime: prev.runTime
							};
						}) : []
						
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
			return;
		}
		
		var playerSave = request.body.player;
		playerSave.id = playerSave._id || playerSave.id;
		
		if (playerSave.id) {
			data.player.findById(playerSave.id)
				.exec()
				.then((playerDb) => {
					
					if (!playerDb) {
						response.status(500).json({ error: "Player not found" });
					}
					
					playerDb.playerDivision = playerSave.playerDivision ? {
						id: playerSave.playerDivision.id ? playerSave.playerDivision.id : playerDb.playerDivision.id,
						name: playerSave.playerDivision.name ? playerSave.playerDivision.name : playerDb.playerDivision.name,
						year: playerSave.playerDivision.year ? playerSave.playerDivision.year : playerDb.playerDivision.year,
						season: playerSave.playerDivision.season ? playerSave.playerDivision.season : playerDb.playerDivision.season
					} : playerDb.playerDivision;
					playerDb.division = playerSave.division ? playerSave.division : playerDb.division;
					playerDb.team = (playerSave.team) ? { id: playerSave.team.id, name: playerSave.team.name } : playerDb.team;
					
					playerDb.draftNumber = playerSave.draftNumber ? playerSave.draftNumber : playerDb.draftNumber;
					playerDb.draftRound = playerSave.draftRound ? playerSave.draftRound : playerDb.draftRound;
					playerDb.draftRank = playerSave.draftRank ? playerSave.draftRank : playerDb.draftRank;
					playerDb.brettRank = playerSave.brettRank ? playerSave.brettRank : playerDb.brettRank;
					playerDb.draftPick = playerSave.draftPick === undefined ? playerDb.draftPick : playerSave.draftPick;
				
					playerDb.firstName = playerSave.firstName ? playerSave.firstName : playerDb.firstName;
					playerDb.lastName = playerSave.lastName ? playerSave.lastName : playerDb.lastName;
					playerDb.playerNumber = playerSave.playerNumber ? playerSave.playerNumber : playerDb.playerNumber;
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
					playerDb.height = playerSave.height || playerSave.height === "" ? playerSave.height || null : playerDb.height;
					playerDb.route = playerSave.route || playerSave.route === "" ? playerSave.route || null : playerDb.route;
					playerDb.speed = playerSave.speed || playerSave.speed === "" ? playerSave.speed || null : playerDb.speed;
					playerDb.hands = playerSave.hands || playerSave.hands === "" ? playerSave.hands || null : playerDb.hands;
					playerDb.draftBlock = playerSave.draftBlock || playerSave.draftBlock === "" ? playerSave.draftBlock || null : playerDb.draftBlock;
					playerDb.draftWatch = playerSave.draftWatch || playerSave.draftWatch === "" ? playerSave.draftWatch || null : playerDb.draftWatch;
					playerDb.notes = playerSave.notes ? playerSave.notes : playerDb.notes;
					
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
					
					playerDb.prev = playerSave.prev ? playerSave.prev.map((prev) => {
						return {
							year: prev.year,
							season: prev.season,
							division: prev.division,
							rank: prev.rank,
							round: prev.round,
							coachProtect: prev.coachProtect,
							coachRequest: prev.coachRequest,
							team: prev.team,
							throwing: prev.throwing,
							catching: prev.catching,
							running: prev.running,
							runTime: prev.runTime
						};
					}) : playerDb.prev || [];
					
					return playerDb.save();
				})
				.then((playerDb) => {
					response.status(200).json({ playerId: playerDb._id });
				})
				.catch((error) => {
					response.status(500).json({ error: error.message });
				});
		}
		else {
			
			new data.player({
				playerDivision: playerSave.playerDivision ? {
					id: playerSave.playerDivision.id,
					name: playerSave.playerDivision.name,
					year: playerSave.playerDivision.year,
					season: playerSave.playerDivision.season
				} : null,
				division: playerSave.division,
				team: (playerSave.team) ? { id: playerSave.team.id, name: playerSave.team.name } : null,
				
				draftNumber: playerSave.draftNumber,
				draftRound: playerSave.draftRound,
				draftRank: playerSave.draftRank,
				brettRank: playerSave.brettRank,
				draftPick: playerSave.draftPick,
				
				firstName: playerSave.firstName,
				lastName: playerSave.lastName,
				playerNumber: playerSave.playerNumber,
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
				height: playerSave.height,
				route: playerSave.route,
				speed: playerSave.speed,
				hands: playerSave.hands,
				draftBlock: playerSave.draftBlock,
				draftWatch: playerSave.draftWatch,
				notes: playerSave.notes,
				
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
				} : null,
				prev: playerSave.prev ? playerSave.prev.map((prev) => {
						return {
							year: prev.year,
							season: prev.season,
							division: prev.division,
							rank: prev.rank,
							round: prev.round,
							coachProtect: prev.coachProtect,
							coachRequest: prev.coachRequest,
							team: prev.team,
							throwing: prev.throwing,
							catching: prev.catching,
							running: prev.running,
							runTime: prev.runTime
						};
					}) : null
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
		var validQueries = "|division|divisionid|id|teamid|teamname|name|";
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
			filter["playerDivision.name"] = request.query.division;
			filter["playerDivision.year"] = 2018;
			filter["playerDivision.season"] = "fall";
		}
		if (request.query.divisionid) {
			filter["playerDivision.id"] = request.query.divisionid;
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
		var validQueries = "|id|name|division|divisionid|managed|";
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
			filter["teamDivision.name"] = request.query.division;
			filter["teamDivision.year"] = 2018;
			filter["teamDivision.season"] = "fall";
		}
		if (request.query.divisionid) {
			filter["teamDivision.id"] = request.query.divisionid;
		}
		if (request.query.managed) {
			filter.isManaged = true;
		}
		
		data.team.find(filter)
			.exec()
			.then((teamsDb) => {
				var teams = teamsDb.map((teamDb) => {
					return {
						id: teamDb._id,
						name: teamDb.name,
						teamDivision: teamDb.teamDivision ? {
							id: teamDb.teamDivision.id,
							name: teamDb.teamDivision.name,
							year: teamDb.teamDivision.year,
							season: teamDb.teamDivision.season
						} : null,
						division: teamDb.division,
						confrence: teamDb.confrence,
						coach: teamDb.coach,
						isManaged: teamDb.isManaged,
						draftRound: teamDb.draftRound,
						practiceDay: teamDb.practiceDay,
						practiceTime: teamDb.practiceTime,
						practiceLocation: teamDb.practiceLocation,
						practiceWeekend: teamDb.practiceWeekend
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
			return;
		}
		
		var teamSave = request.body.team;
		teamSave.id = teamSave._id || teamSave.id;
		
		if (teamSave.id) {
			data.team.findById(teamSave.id)
				.exec()
				.then((teamDb) => {
					if (!teamDb) {
						throw new Error("Team is not found");
					}
					
					teamDb.name = teamSave.name ? teamSave.name : teamDb.name;
					teamDb.teamDivision = teamSave.teamDivision ? {
						id: teamSave.teamDivision.id ? teamSave.teamDivision.id : teamDb.teamDivision.id,
						name: teamSave.teamDivision.name ? teamSave.teamDivision.name : teamDb.teamDivision.name,
						year: teamSave.teamDivision.year ? teamSave.teamDivision.year : teamDb.teamDivision.year,
						season: teamSave.teamDivision.season ? teamSave.teamDivision.season : teamDb.teamDivision.season
					} : teamDb.teamDivision;
					teamDb.division = teamSave.division ? teamSave.division : teamDb.division;
					teamDb.confrence = teamSave.confrence ? teamSave.confrence : teamDb.confrence;
					teamDb.coach = teamSave.coach ? teamSave.coach : teamDb.coach;
					teamDb.isManaged = teamSave.isManaged ? teamSave.isManaged : teamDb.isManaged;
					teamDb.draftRound = teamSave.draftRound ? teamSave.draftRound : teamDb.draftRound;
					teamDb.practiceDay = teamSave.practiceDay ? teamSave.practiceDay : teamDb.practiceDay;
					teamDb.practiceTime = teamSave.practiceTime ? teamSave.practiceTime : teamDb.practiceTime;
					teamDb.practiceLocation = teamSave.practiceLocation ? teamSave.practiceLocation : teamDb.practiceLocation;
					teamDb.practiceWeekend = teamSave.practiceWeekend ? teamSave.practiceWeekend : teamDb.practiceWeekend;
					
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
				teamDivision: teamSave.teamDivision ? {
					id: teamSave.teamDivision.id,
					name: teamSave.teamDivision.name,
					year: teamSave.teamDivision.year,
					season: teamSave.teamDivision.season
				} : null,
				division: teamSave.division,
				confrence: teamSave.confrence,
				coach: teamSave.coach,
				isManaged: teamSave.isManaged,
				draftRound: teamSave.draftRound,
				practiceDay: teamSave.practiceDay,
				practiceTime: teamSave.practiceTime,
				practiceLocation: teamSave.practiceLocation,
				practiceWeekend: teamSave.practiceWeekend
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
		var validQueries = "|id|name|division|divisionid|";
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
			filter["teamDivision.name"] = request.query.division;
			filter["teamDivision.year"] = 2018;
			filter["teamDivision.season"] = "fall";
		}
		if (request.query.divisionid) {
			filter["teamDivision.id"] = request.query.divisionid;
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
		var validQueries = "|date|division|divisionid|teamid|teamname|";
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
			filter["gameDivision.name"] = request.query.division;
			filter["gameDivision.year"] = 2018;
			filter["gameDivision.season"] = "fall";
		}
		if (request.query.divisionid) {
			filter["gameDivision.id"] = request.query.divisionid;
		}
		if (request.query.teamid) {
			filter.$or = [
				{ "homeTeam.id": request.query.teamid },
				{ "awayTeam.id": request.query.teamid }
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
						gameDivision: gameDb.gameDivision ? {
							id: gameDb.gameDivision.id,
							name: gameDb.gameDivision.name,
							year: gameDb.gameDivision.year,
							season: gameDb.gameDivision.season
						} : null,
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
						} :null,
						snackSignupParentId: gameDb.snackSignupParentId
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
			return;
		}
		
		var gameSave = request.body.game;
		gameSave.id = gameSave._id || gameSave.id;
		
		if (gameSave.id) {
			data.game.findById(gameSave.id)
				.exec()
				.then((gameDb) => {
					if (!gameDb) {
						throw new Error("Game can't be found");
					}
					
					gameDb.gameDivision = gameSave.gameDivision ? {
						id: gameSave.gameDivision.id ? gameSave.gameDivision.id : gameDb.gameDivision.id,
						name: gameSave.gameDivision.name ? gameSave.gameDivision.name : gameDb.gameDivision.name,
						year: gameSave.gameDivision.year ? gameSave.gameDivision.year : gameDb.gameDivision.year,
						season: gameSave.gameDivision.season ? gameSave.gameDivision.season : gameDb.gameDivision.season
					} : gameDb.gameDivision;
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
					gameDb.snackSignupParentId = typeof gameSave.snackSignupParentId !== "undefined" ? gameSave.snackSignupParentId : gameDb.snackSignupParentId;
					
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
				gameDivision: gameSave.gameDivision ? {
					id: gameSave.gameDivision.id,
					name: gameSave.gameDivision.name,
					year: gameSave.gameDivision.year,
					season: gameSave.gameDivision.season
				} : null,
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
				} : null,
				snackSignupParentId: gameSave.snackSignupParentId
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
		var validQueries = "|id|date|division|divisionid|teamid|teamname|";
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
			filter["_id"] = request.query.id;
		}
		if (request.query.date) {
			var day = new Date(Date.parse(request.query.date)),
				endDate = new Date(day);
			
			endDate.setDate(day.getDate() + 1);
			filter.dateTime = { $gte: Date.parse(request.query.date), $lt: endDate };
		}
		if (request.query.division) {
			filter["gameDivision.name"] = request.query.division;
			filter["gameDivision.year"] = 2018;
			filter["gameDivision.season"] = "fall";
		}
		if (request.query.divisionid) {
			filter["gameDivision.id"] = request.query.divisionid;
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
	
	app.get("/data/play", (request, response) => {
		var validQueries = "|divisionid|id|name|category|";
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
		
		if (request.query.divisionid) {
			filter["division.id"] = request.query.divisionid;
		}
		if (request.query.id) {
			filter._id = request.query.id;
		}
		if (request.query.name) {
			filter["name"] = { $regex: new RegExp(request.query.name, "i") };
		}
		if (request.query.category) {
			filter["category"] = { $regex: new RegExp(request.query.category, "i") };
		}
		
		data.play.find(filter)
			.exec()
			.then((playsDb) => {
				var plays = playsDb.map((playDb) => {
					return {
						id: playDb._id,
						division: playDb.division ? {
							id: playDb.division.id,
							name: playDb.division.name,
							year: playDb.division.year,
							season: playDb.division.season
						}: null,
						category: playDb.category,
						name: playDb.name,
						scrimageLine: playDb.scrimageLine,
						players: playDb.players.map((player) => {
							return {
								type: player.positionType,
								location: player.location,
								route: player.route
							};
						})
					};
				});
				
				response.status(200).json({plays: plays});
			})
			.catch((error) => {
				response.status(500).json({error: error.message});
			});
		
	});
	
	app.post("/data/play", (request, response) => {
		if (!request.body.play || !request.body.play.division || !request.body.play.players || !request.body.play.name) {
			response.status(500).json({ error: "Invalid save request"});
			return;
		}
		
		var playSave = request.body.play;
		
		if (playSave.id) {
			data.play.findById(playSave.id)
				.exec()
				.then((playDb) => {
					if (!playDb) {
						throw new Error("Play can't be found");
					}
					
					playDb.division = playSave.division ? {
						id: playSave.division.id ? playSave.division.id : playDb.division.id,
						name: playSave.division.name ? playSave.division.name : playDb.division.name,
						year: playSave.division.year ? playSave.division.year : playDb.division.year,
						season: playSave.division.season ? playSave.division.season : playDb.division.season
					} : playSave.division;
					playDb.category = playSave.category ? playSave.category : playDb.category;
					playDb.name = playSave.name ? playSave.name : playDb.name;
					playDb.scrimageLine = playSave.scrimageLine ? playSave.scrimageLine : playDb.scrimageLine;
					playDb.players = playSave.players ? playSave.players.map((player) => {
						return {
							positionType: player.type,
							location: player.location ? {x: player.location.x, y: player.location.y} : null,
							route: player.route ? player.route.map((route) => { return { x: route.x, y: route.y }; }) : null
						};
					}) : playDb.players;
					
					return playDb.save();
				})
				.then((playDb) => {
					response.status(200).json({ playId: playDb._id });
				})
				.catch((error) => {
					response.status(500).json({ error: error.message });
				});
		}
		else {
			
			new data.play({
				division: playSave.division ? {
					id: playSave.division.id,
					name: playSave.division.name,
					year: playSave.division.year,
					season: playSave.division.season
				} : null,
				category: playSave.category,
				name: playSave.name,
				scrimageLine: playSave.scrimageLine,
				players: playSave.players ? playSave.players.map((player) => {
					return {
						positionType: player.type,
						location: player.location ? {x: player.location.x, y: player.location.y} : null,
						route: player.route ? player.route.map((route) => { return { x: route.x, y: route.y }; }) : null
					};
				}) : null
			})
			.save()
			.then((playDb) => {
				response.status(200).json({ playId: playDb._id });
			})
			.catch((error) => {
				response.status(500).json({ error: error.message });
			});
			
		}
	});
	
	app.delete("/data/play", (request, response) => {
		if (!request.query.id) {
			response.status(500).json({error: "Invalid delete request"});
			return;
		}
		
		var filter = { _id: request.query.id };
		
		data.play.deleteOne(filter)
			.then(() => {
				response.status(200).json({status: "ok"});
			})
			.catch((error) => {
				response.status(500).json({error: error.message});
			});
	});
	
	app.get("/data/emaillist", (request, response) => {
		var validQueries = "|divisionid|id|name|";
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
		
		if (request.query.divisionid) {
			filter["divisionId"] = request.query.divisionid;
		}
		if (request.query.id) {
			filter["_id"] = request.query.id;
		}
		if (request.query.name) {
			filter["name"] = { $regex: new RegExp(request.query.name, "i") };
		}
		
		data.emailGroup.find(filter)
			.exec()
			.then((emailGroupsDb) => {
				var emailGroups = emailGroupsDb.map((emailGroupDb) => {
					return {
						id: emailGroupDb._id,
						name: emailGroupDb.name,
						divisionId: emailGroupDb.divisionId,
						emailList: emailGroupDb.emailList
					};
				});
				
				response.status(200).json({emailLists: emailGroups});
			})
			.catch((error) => {
				response.status(500).json({error: error.message});
			});
	});
	
	app.post("/data/emaillist", (request, response) => {
		if (!request.body.emaillist || !request.body.emaillist.divisionId || !request.body.emaillist.name || !request.body.emaillist.emailList) {
			response.status(500).json({ error: "Invalid save request"});
			return;
		}
		
		var emailListSave= request.body.emaillist;
		
		if (emailListSave.id) {
			data.emailGroup.findById(emailListSave.id)
				.exec()
				.then((emailGroupDb) => {
					if (!emailGroupDb) {
						throw new Error("Email group can't be found");
					}
					
					emailGroupDb.divisionId = emailListSave.divisionId;
					emailGroupDb.name = emailListSave.name;
					emailGroupDb.emailList = emailListSave.emailList;
					
					return emailGroupDb.save();
				})
				.then((emailGroupDb) => {
					response.status(200).json({ emailListId: emailGroupDb._id });
				})
				.catch((error) => {
					response.status(500).json({ error: error.message });
				});
		}
		else {
			
			new data.emailGroup({
				divisionId: emailListSave.divisionId,
				name: emailListSave.name,
				emailList: emailListSave.emailList
			})
			.save()
			.then((emailGroupDb) => {
				response.status(200).json({ emailListId: emailGroupDb._id });
			})
			.catch((error) => {
				response.status(500).json({ error: error.message });
			});
			
		}
	});
	
	app.delete("/data/emaillist", (request, response) => {
		if (!request.query.id) {
			response.status(500).json({error: "Invalid delete request"});
			return;
		}
		
		var filter = { _id: request.query.id };
		
		data.emailGroup.deleteOne(filter)
			.then(() => {
				response.status(200).json({status: "ok"});
			})
			.catch((error) => {
				response.status(500).json({error: error.message});
			});
	});
	
	app.get("/data/user", (request, response) => {
		var validQueries = "|id|authToken|";
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
		if (request.query.authToken) {
			filter.authToken = request.query.authToken;
		}
		
		data.user.find(filter)
			.exec()
			.then(usersDB => {
				var users = usersDB.map(userDB => ({
					id: userDB._id,
					name: userDB.name,
					authToken: userDB.authToken,
					divisionIds: userDB.divisionIds ? userDB.divisionIds : []
				}));
				
				response.status(200).json({users: users});
			})
			.catch((error) => {
				response.status(500).json({error: error.message});
			});
	});
		
};