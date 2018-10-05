var mongoose = require("mongoose");

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
		isManaged: Boolean
	}),
	
	player: mongoose.model("player", {
		draftNumber: Number,
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
	})
	
};