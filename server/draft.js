var webRequest = require("request");

module.exports = function (app) {

	app.get("/draft/load", (request, response) => {
		var output = {};
		
		if (!request.query.divisionid) {
			response.status(551).json({error: "Invalid query"});
			return;
		}
		
		webRequest({ url: request.protocol + "://" + request.get("host") + "/data/team?divisionid=" + request.query.divisionid, json: true }, (error, webResponse, body) => {
			if (error) {
				response.status(552).json({error: error});
				return;
			}
			
			output.teams = body.teams;
			
			webRequest({ url: request.protocol + "://" + request.get("host") + "/data/player?divisionid=" + request.query.divisionid, json: true }, (error, webResponse, body) => {
				if (error) {
					response.status(553).json({error: error});
					return;
				}
				
				output.players = body.players;
				
				webRequest({ url: request.protocol + "://" + request.get("host") + "/data/player", json: true }, (error, webResponse, body) => {
					if (error) {
						response.status(553).json({error: error});
						return;
					}
					
					var prevPlayers = body.players;
					
					output.players.forEach(player => {
						player.prev = prevPlayers.filter(prevPlayer => 
							player.playerDivision.id != prevPlayer.playerDivision.id
							&& player.parentEmail == prevPlayer.parentEmail
						);
					});
					
					response.status(200).json(output);
				});
			});
		});
	});

};