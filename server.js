// Setup =======================================================================

const config = require("./server/config");

const express = require("express");
const app = express();
const port = config.port || 8080;

const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const busboy = require("connect-busboy");
const cookieParser = require("cookie-parser");

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
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(busboy()); 

// Routes =======================================================================

require("./server/data")(app);
require("./server/video")(app);
require("./server/film")(app);
require("./server/draft")(app);
require("./server/emailer")(app);
require("./server/snacks")(app);
require("./server/team")(app);
require("./server/static")(app);

// listen (start app with node server.js) ======================================

app.listen(port);
console.log((new Date()) + ": App listening on port " + port);
