var fs = require("fs"),
	path = require("path");

module.exports = function (app) {
	
	app.get("*", function (request, response) {
		var file = path.join(app.get("root"), "/client" + request.path);
		
		fs.access(file, fs.constants.F_OK, (error) => {
			if (error) {
				response.redirect("/");
			}
			else {
				response.sendFile("/client" + request.path, { root: app.get("root") });
			}
		});
	});
	
};