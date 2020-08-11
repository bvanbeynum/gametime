var nodemailer = require("nodemailer"),
	data = require("./datamodels"),
	fs = require("fs"),
	path = require("path"),
	webRequest = require("request");

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
			"\"Dellinger, Daniel\" <dellinger.daniel@outlook.com>",
			"\"Dellinger, Jennifer\" <jenniferodellinger@gmail.com>",
			"\"Dyrness, Carrie\" <ceh4092@yahoo.com>",
			"\"Heredia, Edwin\" <eheredia@live.com>",
			"\"Norek, Sean\" <seannorek@yahoo.com>",
			"\"Sarah\" <sarah.norek@atriumhealth.org>",
			"\"Parker, Virginia\" <virgparker@msn.com>",
			"\"Parker, Cary\" <jcaryparker@gmail.com>",
			"\"Simms, Whitney\" <art3210@yahoo.com>",
			"\"Simms, Jared\" <jsimms@gwblawfirm.com>",
			"\"van Beynum, Sita\" <svanbeynum@gmail.com>",
			"\"Wiand, Carissa\" <carissabertalan@hotmail.com>",
			"\"Craig Wiand\" <craigW@microsoft.com>"
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
	
	app.get("/emailer/emailload", (request, response) => {
		if (!request.query.divisionid || !request.query.teamid) {
			response.status(551).json({error: "Invalid request. Team and division required"});
			return;
		}
		
		var output = {};
		
		webRequest("http://" + request.headers.host + "/data/player?teamid=" + request.query.teamid, {json: true}, (error, webResponse, body) => {
			if (error) {
				response.status(552).json({error: "Could not download players. " + error.message});
				return;
			}
			
			output.players = body.players || [];
			
			webRequest("http://" + request.headers.host + "/data/game?teamid=" + request.query.teamid, {json: true}, (error, webResponse, body) => {
				if (error) {
					response.status(553).json({error: "Could not download games. " + error.message});
					return;
				}
				
				output.games = body.games || [];
				
				
				webRequest("http://" + request.headers.host + "/snacks/parentemails?divisionid=" + request.query.divisionid, {json: true}, (error, webResponse, body) => {
					if (error) {
						response.status(553).json({error: "Could not download parents. " + error.message});
						return;
					}
					
					output.parents = body.parentEmails || [];
					
					webRequest("http://" + request.headers.host + "/data/emaillist?divisionid=" + request.query.divisionid, {json: true}, (error, webResponse, body) => {
						if (error) {
							response.status(554).json({error: "Could not download email lists. " + error.message });
							return;
						}
						
						output.emailLists = body.emailLists || [];
						
						data.emailLog.find({divisionId: request.query.divisionid})
							.exec()
							.then((dbEmails) => {
								output.emails = dbEmails.map((dbEmail) => {
									return {
										sent: dbEmail.sent,
										to: dbEmail.to,
										emailType: dbEmail.emailType,
										divisionId: dbEmail.divisionId,
										emailText: dbEmail.emailText
									};
								});
								
								response.status(200).json(output);
							})
							.catch(error => {
								response.status(554).json({error: error.message});
							});
						
					});
					
				});
				
			});
			
		});
	});
	
	app.get("/emailer/send", (request, response) => {
		if (!request.query.file || !request.query.emailGroup) {
			response.status(500).json({error: "Invalid email request. file and emailGroup are required" });
		}
		
		var service = nodemailer.createTransport({
			host: "smtp.gmail.com",
			port: 465,
			secure: true,
//			auth: gmailAuth
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
	
	app.post("/emailer/sendlist", (request, response) => {
		if (!request.body.email || !request.body.emailList || !Array.isArray(request.body.emailList) || request.body.emailList.length == 0) {
			response.status(500).json({error: "Invalid email request. file and emailGroup are required" });
		}
		
		var email = request.body.email,
			emailList = request.body.emailList,
			divisionId = (request.body.divisionid) ? request.body.divisionid : null;
		
		var regSubject = (RegExp("<title>([^<]+)</title>", "gi")).exec(email),
			attachments = [],
			matches;
		
		if (regSubject < 2) {
			console.log("Could not find the title in the email");
			return;
		}
		
		var regImages = RegExp("<img [\\w =\"]*src=[\"]?([^\" ]+)", "gim");
		while ((matches = regImages.exec(email)) != null) {
			attachments.push({
				filename: matches[1].substring(matches[1].lastIndexOf("/") + 1),
				path: path.join(app.get("root"), "client/" + matches[1]),
				cid: matches[1].substring(matches[1].lastIndexOf("/") + 1, matches[1].lastIndexOf("."))
			});
			email = email.replace(matches[1], "cid:" + matches[1].substring(matches[1].lastIndexOf("/") + 1, matches[1].lastIndexOf(".")));
		}
		
		var regCSS = /background:[\w -]*url\(["]?([^"]+)["]?\)/gim;
		while ((matches = regCSS.exec(email)) != null) {
			attachments.push({
				filename: matches[1].substring(matches[1].lastIndexOf("/") + 1),
				path: path.join(app.get("root"), "client/" + matches[1]),
				cid: matches[1].substring(matches[1].lastIndexOf("/") + 1, matches[1].lastIndexOf("."))
			});
			email = email.replace(matches[1], "cid:" + matches[1].substring(matches[1].lastIndexOf("/") + 1, matches[1].lastIndexOf(".")));
		}
		
		var regAttach = RegExp("<attach [\\w =\"]*src=[\"]?([^\" ]+)[\"]?[\w =\"]*/>", "gim");
		while ((matches = regAttach.exec(email)) != null) {
			attachments.push({
				filename: matches[1].substring(matches[1].lastIndexOf("/") + 1),
				path: path.join(app.get("root"), "client/" + matches[1])
			});
			email = email.replace(matches[0], "");
		}
		
		var service = nodemailer.createTransport({
			host: "smtp.gmail.com",
			port: 465,
			secure: true,
			auth: {
				type: "OAuth2",
				clientId: "743032936512-vpikma7crc8dssoah9bv1la06s2sl4a2.apps.googleusercontent.com",
				clientSecret: "EGD193Mwf6kO798wdP9Bq7lf"
			}
		});
		
		var options = {
			from: "\"Brett van Beynum\" <bvanbeynum@gmail.com>",
			to: emailList,
			subject: regSubject[1] + " \uD83C\uDFC8",
			html: email,
			attachments: attachments,
			auth: {
				user: "bvanbeynum@gmail.com",
				refreshToken: "1//04K4dB_Z_X1rQCgYIARAAGAQSNwF-L9Irhjcc5YawPcBGv-zZuBiZHm2-s3bgPEJf6VQm6b9eTs7E4iuRbUij6-tzAVYi_3ZXbVU",
				accessToken: "ya29.a0AfH6SMCf0nD3px4QPS-MABYUSpsEEPPdOGAJkvCfOE5eMiuBIUPw-EWunj6wsbEXtJthE16v02r6VWhdcjOaUEmqGFQsD7iEZR26h4B8Lzfh-NAw2OjpfApxfjNz5NEv-JAT6kBTA4J7G2rntClDhTxanW-6_s2y528",
				expires: 3460
			}
		};
		
		service.sendMail(options, (error, mailResponse) => {
			if (error) {
				console.log(error);
				response.status(551).json({error: error.message});
				return;
			}
			else {
				new data.emailLog({
					sent: new Date(),
					to: emailList,
					divisionId: divisionId,
					emailType: regSubject[1],
					emailText: email
				})
				.save()
				.then((emailLogDb) => {
					response.status(200).json({status: "ok"});
					return;
				})
				.catch((error) => {
					response.status(200).json({status: "ok"});
					return;
				});
			}
		});
	});
	
};