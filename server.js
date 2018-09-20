// Setup =======================================================================

var express = require("express");
var app = express();
var port = process.env.PORT || 8080;

var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var cookieParser = require("cookie-parser");
var config = require("./server/config");

// Config =======================================================================

mongoose.Promise = require("bluebird");

if (config.mongo.user) {
	mongoose.connect("mongodb://" + config.mongo.user + ":" + config.mongo.pass + "@" + config.mongo.servers.join(",") + "/" + config.mongo.database + "?authSource=gameTime", { useMongoClient: true });
}
else {
	mongoose.connect("mongodb://" + config.mongo.servers.join(",") + "/" + config.mongo.database, { useMongoClient: true });
}

app.set("x-powered-by", false);
app.set("root", __dirname);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes =======================================================================

require("./server/data")(app);
require("./server/film")(app);
require("./server/emailer")(app);
require("./server/team")(app);
require("./server/stats")(app);
require("./server/static")(app);

// listen (start app with node server.js) ======================================

app.listen(port);
console.log("App listening on port " + port);
