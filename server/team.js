module.exports = (app) => {
		
	app.get("/team", (request, response) => {
		response.sendFile("/client/team/team.html", { root: app.get("root") });
	});

};