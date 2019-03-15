var mongoose = require("mongoose");

var locationSchema = new mongoose.Schema({
	x: Number,
	y: Number
});

var playerSchema = new mongoose.Schema({
	positionType: String,
	location: { type: locationSchema },
	route: [{type: locationSchema}]
});

var prevYearSchema = new mongoose.Schema({
		year: String,
		season: String,
		division: String,
		rank: Number,
		round: Number,
		coachProtect: String,
		coachRequest: String,
		team: String,
		throwing: Number,
		catching: Number,
		running: Number,
		runTime: Number
});

module.exports = {
	
	division: mongoose.model("division", {
		name: String,
		year: Number,
		season: String
	}),
	
	team: mongoose.model("team", {
		name: String,
		teamDivision: {
			id: String,
			name: String,
			year: Number,
			season: String
		},
		division: String,
		confrence: String,
		coach: String,
		isManaged: Boolean,
		draftRound: Number,
		practiceDay: String,
		practiceTime: String,
		practiceLocation: String,
		practiceWeekend: String
	}),
	
	player: mongoose.model("player", {
		playerDivision: {
			id: String,
			name: String,
			year: Number,
			season: String
		},
		division: String,
		team: {
			id: String,
			name: String
		},
		draftRound: Number,
		draftRank: Number,
		brettRank: Number,
		draftNumber: Number,
		draftPick: Number,

		firstName: String,
		lastName: String,
		dateOfBirth: Date,
		parentName: String,
		parentEmail: String,
		Phone: String,
		shirtSize: String,
		allergies: String,

		requests: String,
		coachRequest: String,
		coachProtect: String,

		recThrowing: Number,
		recCatching: Number,
		throwing: Number,
		catching: Number,
		running: Number,
		runTime: Number,
		height: Number,
		
		spring2018: {
			division: String,
			recRank: Number,
			round: Number,
			coachProtect: String,
			coachRequest: String,
			team: String,
			throwing: Number,
			catching: Number,
			running: Number,
			runTime: Number
		},
		prev: [{type: prevYearSchema}]
	}),
	
	game: mongoose.model("game", {
		gameDivision: {
			id: String,
			name: String,
			year: Number,
			season: String
		},
		division: String,
		dateTime: Date,
		homeTeam: {
			id: String,
			name: String,
			score: Number,
			isWinner: Boolean
		},
		awayTeam: {
			id: String,
			name: String,
			score: Number,
			isWinner: Boolean
		},
		field: String,
		snackSignupParentId: String
	}),
	
	play: mongoose.model("play", {
		division: {
			id: String,
			name: String,
			year: Number,
			season: String
		},
		category: String,
		name: String,
		scrimageLine: Number,
		players: [playerSchema]
	}),
	
	parentEmail: mongoose.model("parentEmail", {
		division: { 
			id: String
		},
		name: String,
		email: String,
		playerId: String,
		emailGroups: [String]
	}),
	
	emailGroup: mongoose.model("emailGroup", {
		name: String,
		division: { 
			id: String
		},
		emailList: [String]
	}),
	
	emailLog: mongoose.model("emailLog", {
		sent: Date,
		to: [String],
		emailType: String,
		emailText: String
	})
	
};