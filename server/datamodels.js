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

		requests: String,
		coachRequest: String,
		coachProtect: String,

		recThrowing: Number,
		recCatching: Number,
		throwing: Number,
		catching: Number,
		running: Number,
		runTime: Number,
		spring2018: {
			division: String,
			recRank: Number,
			coachProtect: String,
			coachRequest: String,
			team: String,
			throwing: Number,
			catching: Number,
			running: Number,
			runTime: Number
		}
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
		field: String
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
	})
	
};