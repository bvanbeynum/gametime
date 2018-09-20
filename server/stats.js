module.exports = (app) => {
		
	app.get("/stats", (request, response) => {
		response.sendFile("/client/stats/stats.html", { root: app.get("root") });
	});

};