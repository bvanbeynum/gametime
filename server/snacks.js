var data = require("./datamodels");

module.exports = (app) => {
	
	app.get("/snacks", (request, response) => {
		response.sendFile("/client/snacks/snacks.html", { root: app.get("root") });
	});
	
	app.get("/snacks/parentemails", (request, response) => {
		if (!request.query.divisionid) {
			response.status(551).json({ error: "Invalid division selected" });
			return;
		}
		
		data.parentEmail.find({
			"division.id": request.query.divisionid
		})
		.exec()
		.then(parentEmailsDb => {
			response.status(200).json({ parentEmails: parentEmailsDb });
		})
		.catch(error => {
			response.status(552).json({ error: error.message });
		});
	});
	
	app.get("/snacks/load", (request, response) => {
		if (!request.query.emailid) {
			response.status(500).json({error: "Invalid lookup parameters"});
			return;
		}
		
		data.parentEmail.findById(request.query.emailid)
			.exec()
			.then(parentEmailDb => {
				
				data.player.findById(parentEmailDb.playerId)
					.exec()
					.then(playerDb => {
						
						data.game.find({
							"gameDivision.id": parentEmailDb.division.id,
							"$or": [
								{ "homeTeam.id": playerDb && playerDb.team ? playerDb.team.id : null },
								{ "awayTeam.id": playerDb && playerDb.team ? playerDb.team.id : null }
								]
						})
						.exec()
						.then(gamesDb => {
							var games = gamesDb;
							
							data.parentEmail.find({
								"division.id": parentEmailDb.division.id
							})
							.exec()
							.then((parentEmailsDb) => {
								response.status(200).json({ games: games, parentEmails: parentEmailsDb });
							})
							.catch(error => {
								response.status(553).json({ error: error.message });
							});
							
						})
						.catch(error => {
							response.status(552).json({ error: error.message });
						});
						
					})
					.catch(error => {
						response.status(554).json({ error: error.message });
					});
				
			})
			.catch(error => {
				response.status(551).json({ error: error.message });
			});
		
	});
	
	app.post("/snacks/parentemail", (request, response) => {
		if (!request.body.parentEmail || !request.body.parentEmail.name || !request.body.parentEmail.email) {
			response.status(501).json({ error: "Invalid email request" });
			return;
		}
		
		var saveEmail = request.body.parentEmail;
		saveEmail.id = saveEmail._id || saveEmail.id;
		
		if (saveEmail.id) {
			data.parentEmail.findById(saveEmail.id)
				.exec()
				.then((parentEmailDb) => {
					if (!parentEmailDb) {
						response.status(503).json({ error: "Could not find email "});
						return;
					}
					
					parentEmailDb.division = saveEmail.division ? saveEmail.division : parentEmailDb.division;
					parentEmailDb.name = saveEmail.name;
					parentEmailDb.email = saveEmail.email;
					parentEmailDb.playerId = saveEmail.playerId;
					parentEmailDb.emailGroups = saveEmail.emailGroups;
					
					return parentEmailDb.save();
				})
				.then(parentEmailDb => {
					response.status(200).json({ parentEmailId: parentEmailDb._id });
				})
				.catch((error) => {
					response.status(502).json({ error: error.message });
				});
		}
		else {
			new data.parentEmail({
				division: saveEmail.division,
				name: saveEmail.name,
				email: saveEmail.email,
				playerId: saveEmail.playerId,
				emailGroups: saveEmail.emailGroups
			})
			.save()
			.then(parentEmailDb => {
				response.status(200).json({ parentEmailId: parentEmailDb._id });
			})
			.catch(error => {
				response.status(504).json({ error: error.message });
			});
		}
	});
	
};