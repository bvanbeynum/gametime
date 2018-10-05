module.exports = (app) => {
		
	app.get("/", (request, response) => {
		response.sendFile("/client/team/index.html", { root: app.get("root") });
	});

};