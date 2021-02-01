// Setup =======================================================================

var express = require("express");
var app = express();
var port = process.env.PORT || 8080;

var mongoose = require("mongoose");
var bodyParser = require("body-parser");
var busboy = require("connect-busboy");
var cookieParser = require("cookie-parser");
var config = require("./server/config");

// Config =======================================================================

mongoose.Promise = require("bluebird");

if (config.mongo.user) {
	mongoose.connect("mongodb://" + config.mongo.user + ":" + config.mongo.pass + "@" + config.mongo.servers.join(",") + "/" + config.mongo.database + "?authSource=gameTime", {useNewUrlParser: true});
}
else {
	mongoose.connect("mongodb://" + config.mongo.servers.join(",") + "/" + config.mongo.database, {useNewUrlParser: true});
}

app.set("x-powered-by", false);
app.set("root", __dirname);

app.use(cookieParser());
//app.use(bodyParser.json());
//app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json({limit: "50mb"}));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true, parameterLimit: 50000 }));
app.use(busboy()); 

// Routes =======================================================================

require("./server/data")(app);
require("./server/film")(app);
require("./server/draft")(app);
require("./server/emailer")(app);
require("./server/snacks")(app);
require("./server/team")(app);
require("./server/static")(app);

// listen (start app with node server.js) ======================================

app.listen(port);
console.log((new Date()) + ": App listening on port " + port);
