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
						
						if (users.length == 1) {
							divisions = divisions.filter(division => !division.restricted || users[0].divisionIds.some(divisionId => division.id == divisionId));
						}
						else {
							divisions = divisions.filter(division => !division.restricted);
						}
						
						teams = teams.filter(team => divisions.some(division => division.id == team.teamDivision.id));
						response.status(200).json({ divisions: divisions, teams: teams });
					});
				}
				else {
					divisions = divisions.filter(division => !division.restricted);
					teams = teams.filter(team => divisions.some(division => division.id == team.teamDivision.id));
					response.status(200).json({ divisions: divisions, teams: teams });
				}
			});
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
	
	app.get("/", (request, response) => {
		response.sendFile("/client/team/index.html", { root: app.get("root") });
	});

};