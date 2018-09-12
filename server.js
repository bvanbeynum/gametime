// Setup =======================================================================

var express = require("express");
var app = express();
var port = process.env.PORT || 8080;

var bodyParser = require("body-parser");

// Config =======================================================================

app.set("x-powered-by", false);
app.set("root", __dirname);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes =======================================================================

require("./server/app")(app);
require("./server/static")(app);

// listen (start app with node server.js) ======================================

app.listen(port);
console.log("App listening on port " + port);
