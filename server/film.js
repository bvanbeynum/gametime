var http = require("https");
var fs = require("fs");

module.exports = function (app) {
	
	app.get("/film", (request, response) => {
		response.sendFile("/client/film/film.html", { root: app.get("root") });
	});
	
	app.get("/film/loadvideo", (request, response) => {
		var now = new Date(),
			tempFolder = "client/temp/",
			tempFileName = "" + now.getFullYear() + now.getMonth() + now.getDate() + now.getHours() + now.getMinutes() + now.getSeconds() + ".mp4";
		
		// Delete all existing temp files
		fs.readdir(tempFolder, (error, files) => {
			if (error) {
				return;
			}
			
			files.forEach((file) => {
				fs.unlink(tempFolder + file);
			});
		});
		
		// Open the file for writing
		var tempFile = fs.createWriteStream(tempFolder + tempFileName);
		
		// Get the URL from the passed in URL
		http.get(request.query.photourl, (webResponse) => {
			if (webResponse.statusCode == 200) {
				// Pipe the output to the file stream
				webResponse.pipe(tempFile);
				
				tempFile.on("finish", () => {
					// Close the file stream
					
					// Send the URL to access the file
					response.status(200).json({ url: "http://" + request.headers.host + "/temp/" + tempFileName});
					tempFile.close();
				});
			}
			else if (webResponse.statusCode == 302) {
				// Google redirected the url to a new location
				http.get(webResponse.headers.location, (webResponse) => {
					// Pipe to the file stream
					webResponse.pipe(tempFile);
					
					tempFile.on("finish", () => {
						// Close the file stream
						tempFile.close();
						
						// Send the url to access the file
						response.status(200).json({ url: "http://" + request.headers.host + "/temp/" + tempFileName});
					});
				})
				.on("error", (error) => {
					// Some error from the file
					fs.unlink(tempFolder + tempFileName);
					
					console.log(error);
					response.status(503).json({ error: "Could not download video file" });
				});
			}
			else {
				// There was an error - most likely the access token that was used is no longer valid
				// Delete the temp file
				fs.unlink(tempFolder + tempFileName);
				
				// Send the error to the user
				response.status(502).json({ error: webResponse.statusCode + ": Could not download video file" });
			}
		})
		.on("error", (error) => {
			// Some error from the file
			fs.unlink(tempFolder + tempFileName);
			
			console.log(error);
			response.status(501).json({ error: "Could not download video file" });
		});
	});

	app.get("/film/*", (request, response) => {
		response.sendFile("/client" + request.path, { root: app.get("root") });
	});
		
};