var webRequest = require("request");

module.exports = function (app) {

	app.get("/draft/load", (request, response) => {
		var output = {};
		
		if (!request.query.divisionid) {
			response.status(551).json({error: "Invalid query"});
			return;
		}
		
		webRequest(request.protocol + "://" + request.get("host") + "/data/team?divisionid=" + request.query.divisionid, (error, webResponse, body) => {
			if (error) {
				response.status(552).json({error: error});
				return;
			}
			
			output.teams = JSON.parse(body).teams;
			
			webRequest(request.protocol + "://" + request.get("host") + "/data/player?divisionid=" + request.query.divisionid, (error, webResponse, body) => {
				if (error) {
					response.status(553).json({error: error});
					return;
				}
				
				output.players = JSON.parse(body).players;
				
				response.status(200).json(output);
			});
		});
	});

};