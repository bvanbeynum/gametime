var http = require("https"),
	fs = require("fs"),
	config = require("./config"),
	path = require("path");

module.exports = function (app) {
	
	app.get("/film", (request, response) => {
		response.sendFile("/client/film/film.html", { root: app.get("root") });
	});
	
	app.get("/film/loadvideo", (request, response) => {
		console.log("start load");
		var now = new Date(),
			tempFolder = path.join(app.get("root"), "/client/temp/"),
			tempFileName = "" + now.getFullYear() + now.getMonth() + now.getDate() + now.getHours() + now.getMinutes() + now.getSeconds() + ".mp4";
		
		// Delete all existing temp files
		fs.readdir(tempFolder, (error, files) => {
			if (error) {
				console.log(error.message);
				return;
			}
			
			files.forEach((file) => {
				fs.unlink(tempFolder + file);
			});
		});
		console.log("deleted files");
		
		// Open the file for writing
		var tempFile = fs.createWriteStream(tempFolder + tempFileName);
		console.log("opened stream");
		
		// Get the URL from the passed in URL
		http.get(request.query.photourl, (webResponse) => {
			if (webResponse.statusCode == 200) {
		console.log("opened url 1");
				// Pipe the output to the file stream
				webResponse.pipe(tempFile);
				console.log("piped file 1");
				
				tempFile.on("finish", () => {
					// Close the file stream
					tempFile.close();
					console.log("closed file 1");
					
					// Send the URL to access the file
					response.status(200).json({ url: "http://" + request.headers.host + "/temp/" + tempFileName});
				});
			}
			else if (webResponse.statusCode == 302) {
				// Google redirected the url to a new location
				http.get(webResponse.headers.location, (webResponse) => {
		console.log("opened url 2");
					// Pipe to the file stream
					webResponse.pipe(tempFile);
				console.log("piped file 2");
					
					tempFile.on("finish", () => {
						// Close the file stream
						tempFile.close();
					console.log("closed file 2");
						
						// Send the url to access the file
						response.status(200).json({ url: "http://" + request.headers.host + "/temp/" + tempFileName});
					});
				})
				.on("error", (error) => {
					// Some error from the file
					fs.unlink(tempFolder + tempFileName);
					
					console.log(error);
					response.status(553).json({ error: "Could not download video file" });
				});
			}
			else {
				// There was an error - most likely the access token that was used is no longer valid
				// Delete the temp file
				fs.unlink(tempFolder + tempFileName);
				
				// Send the error to the user
				response.status(552).json({ error: webResponse.statusCode + ": Could not download video file" });
			}
		})
		.on("error", (error) => {
			console.log("couldn't load file");
			// Some error from the file
			fs.unlink(tempFolder + tempFileName);
			
			console.log(error);
			response.status(551).json({ error: "Could not download video file" });
		});
	});
	
	app.get("/film/film.js", (request, response) => {
		fs.readFile(path.join(app.get("root"), "/client" + request.path), (error, fileContents) => {
			if (error) {
				console.log(JSON.stringify(error));
				return;
			}
			
			fileContents = fileContents + "";
			
			// Replace any variables
			var regex;
			config.serverVars.forEach((variable) => {
				regex = new RegExp("<GT[ ]*" + variable.key + "[ ]*>", "gmi");
				fileContents = fileContents.replace(regex, variable.value);
			});
			
			response.status(200).send(fileContents);
		});
	});

	app.get("/film/*", (request, response) => {
		fs.readFile(path.join(app.get("root"), "/client" + request.path), (error, fileContents) => {
			if (error) {
				console.log(JSON.stringify(error));
				return;
			}
			
			fileContents = fileContents + "";
			
			// Replace any variables
			var regex;
			config.serverVars.forEach((variable) => {
				regex = new RegExp("<GT[ ]*" + variable.key + "[ ]*>", "gmi");
				fileContents = fileContents.replace(regex, variable.value);
			});
			
			response.status(200).send(fileContents);
		});
	});
		
};