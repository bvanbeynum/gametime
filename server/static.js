module.exports = function (app) {
	
	app.get("*", function (request, response) {
		response.sendFile("/client" + request.path, { root: app.get("root") });
	});
	
};