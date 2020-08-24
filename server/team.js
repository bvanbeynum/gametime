var webRequest = require("request");

module.exports = (app) => {
	
	app.get("/api/division/load", (request, response) => {
		webRequest({url: "http://" + request.headers.host + "/data/division", json: true }, (error, webResponse, webBody) => {
			if (error) {
				response.status(500).json({error: error.message});
				response.end();
				return;
			}
			
			var divisions = webBody.divisions;
			
			webRequest({url: "http://" + request.headers.host + "/data/team?managed=true", json: true }, (error, webResponse, webBody) => {
				if (error) {
					response.status(500).json({error: error.message});
					response.end();
					return;
				}
				
				var teams = webBody.teams;
				
				if (request.cookies.t) {
					webRequest({url: "http://" + request.headers.host + "/data/user?id=" + request.cookies.t, json: true }, (error, webResponse, webBody) => {
						if (error) {
							response.status(500).json({error: error.message});
							response.end();
							return;
						}
						
						var users = webBody.users;
						
						response.status(200).json({ divisions: divisions, teams: teams, user: users.length == 1 ? users[0] : null });
					});
				}
				else {
					response.status(200).json({ divisions: divisions, teams: teams, user: null });
				}
			});
		});
	});
	
	app.get("/api/schedule/load", (request, response) => {
		if (!request.query.teamid) {
			response.status(501).json({error: "Invalid request"});
			response.end();
			return;
		}
		
		webRequest({ url: request.protocol + "://" + request.get("host") + "/data/player?teamid=" + request.query.teamid, json: true }, (error, webResponse, body) => {
			if (error) {
				response.status(500).json({error: error.message});
				response.end();
				return;
			}
			
			var players = body.players;
			response.status(200).json({ players: players });
		});
	});
	
	app.get("/api/eval/load", (request, response) => {
		if (!request.query.divisionid) {
			response.status(501).json({error: "Invalid request"});
			response.end();
			return;
		}
		
		webRequest({ url: "http://" + request.headers.host + "/data/player?divisionid=" + request.query.divisionid, json: true}, (error, webResponse, webBody) => {
			if (error) {
				response.status(500).json({error: error.message});
				response.end();
				return;
			}
			
			var players = webBody.players;
			response.status(200).json({ players: players });
		});
	});
	
	app.post("/api/eval/savePlayer", (request, response) => {
		if (!request.body.player) {
			response.status(500).json({error: "Invalid player" });
			return;
		}
		
		webRequest.post({url: "http://" + request.headers.host + "/data/player", form: { player: request.body.player } }, (error, webResponse, webBody) => {
			if (error) {
				response.status(500).json({error: error.message});
				response.end();
				return;
			}
			
			var playerId = webBody.playerId;
			
			response.status(200).json({playerId: playerId});
		});
	});

	app.get("/login", (request, response) => {
		webRequest({url: "http://" + request.headers.host + "/data/user?authToken=" + request.query.t, json: true }, (error, webResponse, webBody) => {
			if (error) {
				response.status(500).json({error: error.message});
				response.end();
				return;
			}
			
			if (webBody.users && webBody.users.length == 1) {
				response.cookie("t", webBody.users[0].id, { expires: new Date(Date.now() + (1000*3600*24*365)) });
			}
			
			response.redirect("/");
		});
	});
	
	app.get("/api/depthchart/load", (request, response) => {
		if (!request.query.teamid) {
			response.status(500).json({error: "Invalid request"});
			return;
		}
		
		webRequest({ url: request.protocol + "://" + request.get("host") + "/data/player?teamid=" + request.query.teamid, json: true }, (error, webResponse, body) => {
			if (error) {
				response.status(500).json({ error: error.message });
				return;
			}
			
			var players = body.players;
			response.status(200).json({ players: players });
			
		});
	});
	
	app.post("/api/depthchart/saveplayer", (request, response) => {
		if (!request.body.player) {
			response.status(500).json({error: "Invalid player" });
			return;
		}
		
		webRequest.post({url: request.protocol + "://" + request.headers.host + "/data/player", form: { player: request.body.player }, json: true }, (error, webResponse, body) => {
			if (error) {
				response.status(500).json({error: error.message});
				response.end();
				return;
			}
			
			var playerId = body.playerId;
			response.status(200).json({ playerId: playerId });
		});
	});
	
	app.get("/", (request, response) => {
		response.sendFile("/client/team/index.html", { root: app.get("root") });
	});

};