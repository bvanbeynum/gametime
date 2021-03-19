const path = require("path");
const fs = require("fs");
const ffmpegPath = require('@ffmpeg-installer/ffmpeg').path;
const ffmpeg = require("fluent-ffmpeg");
ffmpeg.setFfmpegPath(ffmpegPath);

module.exports = function (app) {
	
	app.post("/video/api/uploadvideo", (request, response) => {
		
		request.busboy.on("file", (fieldName, file, fileName) => {
			file.pipe(fs.createWriteStream(path.join(app.get("root"), "client/video/files/" + fileName)));
		});
		
		request.busboy.on("finish", () => {
			response.status(200).json({status: "ok"});
		});
		
		request.pipe(request.busboy);
	});
	
	app.get("/video/api/load", (request, response) => {
		fs.readdir(path.join(app.get("root"), "client/video/files"), (error, files) => {
			
			if (error) {
				response.status(501).json({ error: error.message });
				response.end();
			}
			else {
				let videos = [];
				for (var file of files) {
					if (/.mp4/i.test(file)) {
						videos.push(file);
					}
				}
				
				response.status(200).json({ files: videos });
			}
			
		});
	});
	
	app.get("/video/api/convert", (request, response) => {
		if (!request.query.file) {
			response.status(553).json({ error: "Missing file paramater" });
			response.end();
			return;
		}
		
		const outputFile = Date.now() + ".gif";
		
		const options = [
			request.query.top && request.query.left && request.query.width && request.query.height ? "crop=" + (+request.query.width) + ":" + (+request.query.height) + ":" + (+request.query.left) + ":" + (+request.query.top) : "",
			"scale=" + (+request.query.outputwidth || 180) + ":-1",
			"framerate=fps=" + (+request.query.framerate || 10)
		];
		
		const converter = ffmpeg(path.join(app.get("root"), "client/video/files/" + request.query.file))
			.outputOptions("-vf", options.filter(option => option).join(","));
		
		if (request.query.start && !Number.isNaN(request.query.start)) {
			converter.setStartTime(+request.query.start);
		}
		
		if (request.query.duration && !Number.isNaN(request.query.duration)) {
			converter.setDuration(+request.query.duration);
		}
		
		converter.output(path.join(app.get("root"), "client/video/files/" + outputFile))
			.on("end", () => {
				
				const fileData = fs.statSync(path.join(app.get("root"), "client/video/files/" + outputFile));
				const fileSizeInBytes = fileData.size;
				const fileSizeInMegabytes = fileSizeInBytes / (1024 * 1024);
				
				response.status(200).json({ fileName: outputFile, size: fileSizeInMegabytes });
				
			})
			.on("error", (error) => {
				response.status(552).json({ error: error.message });
			})
			.run();
	});
	
};