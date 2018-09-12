var http = require("https");
var fs = require("fs");

module.exports = function (app) {
	
	app.get("/loadvideo", (request, response) => {
		var tempFile = fs.createWriteStream("client/temp.txt");
		
		http.get(request.query.photourl, (webResponse) => {
			console.log("status: " + webResponse.statusCode);
			
			if (webResponse.statusCode == 302) {
				http.get(webResponse.headers.location, (webResponse) => {
					webResponse.pipe(tempFile);
					
					tempFile.on("finish", () => {
						tempFile.close();
					});
					console.log("downloaded redirected file");
				});
			}
			else {
				webResponse.pipe(tempFile);
				
				tempFile.on("finish", () => {
					tempFile.close();
				});
				console.log("downloaded file");
			}
		})
		.on("error", (err) => {
			fs.unlink("client/temp.txt");
			
			console.log(err);
		});
		
		response.status(200).send("ok - ");
	});
	
};