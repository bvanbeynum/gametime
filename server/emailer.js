var nodemailer = require("nodemailer"),
	fs = require("fs"),
	path = require("path"),
	gmailAuth = {
		user: "bvanbeynum@gmail.com",
		pass: "dfnpqfmuxwctqsfx"
	};

var toGroup = {
	self: ["\"Brett\" <maildrop444@gmail.com>"],
	family: ["\"Brett\" <maildrop444@gmail.com>", "\"Sita van Beynum\" <svanbeynum@gmail.com>"],
	mom: ["\"Grandma\" <msanborng@gmail.com>", "\"Grandpa\" <fabman54@gmail.com>"],
	dad: ["\"Opa\" <rvanbeynum@gmail.com>", "\"Oma\" <sarvanbeynum@gmail.com>"],
	great: ["\"Great Grandma\" <goldenquill@frontier.com>"],
	team: [
		"\"Brett van Beynum\" <bvanbeynum@gmail.com>",
		"\"Brzozka, Brian\" <bbrzozka@aol.com>",
		"\"Canty, Tim\" <Irishbluegold@yahoo.com>",
		"\"Campbell, Amber\" <charlovescars@yahoo.com>",
		"\"Campbell, Jared\" <jdcrtr73@gmail.com>",
		"\"Dellinger, Jennifer\" <jenniferodellinger@gmail.com>",
		"\"Dyrness, Carrie\" <ceh4092@yahoo.com>",
		"\"Heredia, Edwin\" <eheredia@live.com>",
		"\"Norek, Sean\" <seannorek@yahoo.com>",
		"\"Sarah\" <sarah.norek@atriumhealth.org>",
		"\"Parker, Virginia\" <virgparker@msn.com>",
		"\"Parker, Cary\" <jcaryparker@gmail.com>",
		"\"Simms, Whitney\" <art3210@yahoo.com>",
		"\"van Beynum, Sita\" <svanbeynum@gmail.com>",
		"\"Wiand, Carissa\" <carissabertalan@hotmail.com>",
		"\"Craig Wiand\" <craigW@microsoft.com>",
	]
};

module.exports = (app) => {
	
	app.get("/emailer", (request, response) => {
		response.sendFile("/client/emailer/emailer.html", { root: app.get("root") });
	});
	
	app.get("/emailer/load", (request, response) => {
		fs.readdir(path.join(app.get("root"), "/client/emailer/emails/"), (error, files) => {
			if (error) {
				response.status(500).json({error: error.message });
				return;
			}
			
			var emails = files.filter((file) => {
				return file.substring(file.lastIndexOf(".")) == ".html";
			})
			.map((file) => {
				return {
					name: file.substring(0, file.lastIndexOf(".")).replace(/\b\S/g, (letter) => { return letter.toUpperCase() }),
					file: file
				};
			});
			
			var emailGroups = toGroup;
			
			response.status(200).json({emails: emails, emailGroups: emailGroups });
		});
	});
	
	app.get("/emailer/send", (request, response) => {
		if (!request.query.file || !request.query.emailGroup) {
			response.status(500).json({error: "Invalid email request. file and emailGroup are required" });
		}
		
		var service = nodemailer.createTransport({
			service: "gmail",
			auth: gmailAuth
		});
		
		fs.readFile(path.join(app.get("root"), "/client/emailer/emails/" + request.query.file), "utf-8", function (error, data) {
			if (error) {
				response.status(500).json({error: error.message});
				return;
			}
			
			var regSubject = (RegExp("<title>([^<]+)</title>", "gi")).exec(data),
				attachments = [],
				matches;
			
			if (regSubject < 2) {
				console.log("Could not find the title in the email");
				return;
			}
			
			var regImages = RegExp("<img [\\w =\"]*src=[\"]?([^\" ]+)", "gim");
			while ((matches = regImages.exec(data)) != null) {
				attachments.push({
					filename: matches[1].substring(matches[1].lastIndexOf("/") + 1),
					path: path.join(app.get("root"), "client/" + matches[1]),
					cid: matches[1].substring(matches[1].lastIndexOf("/") + 1, matches[1].lastIndexOf("."))
				});
				data = data.replace(matches[1], "cid:" + matches[1].substring(matches[1].lastIndexOf("/") + 1, matches[1].lastIndexOf(".")));
			}
			
			var regCSS = /background:[\w -]*url\(["]?([^"]+)["]?\)/gim;
			while ((matches = regCSS.exec(data)) != null) {
				attachments.push({
					filename: matches[1].substring(matches[1].lastIndexOf("/") + 1),
					path: path.join(app.get("root"), "client/" + matches[1]),
					cid: matches[1].substring(matches[1].lastIndexOf("/") + 1, matches[1].lastIndexOf("."))
				});
				data = data.replace(matches[1], "cid:" + matches[1].substring(matches[1].lastIndexOf("/") + 1, matches[1].lastIndexOf(".")));
			}
			
			var regAttach = RegExp("<attach [\\w =\"]*src=[\"]?([^\" ]+)[\"]?[\w =\"]*/>", "gim");
			while ((matches = regAttach.exec(data)) != null) {
				attachments.push({
					filename: matches[1].substring(matches[1].lastIndexOf("/") + 1),
					path: path.join(app.get("root"), "client/" + matches[1])
				});
				data = data.replace(matches[0], "");
			}
			
			var options = {
				from: "\"Brett van Beynum\" <bvanbeynum@gmail.com>",
				to: toGroup[request.query.emailGroup.toLowerCase()],
				subject: regSubject[1] + " \uD83C\uDFC8",
				html: data,
				attachments: attachments
			};
			
			service.sendMail(options, (error, data) => {
				if (error) {
					response.status(500).json({error: error.message});
				}
				else {
					response.status(200).json({status: "ok"});
				}
			});
		});
		
	});
	
};