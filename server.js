//Dependencies
var express = require("express");
var mongojs = require("mongojs");
var bodyParser = require("body-parser");
var handlebars = require("express-handlebars");
var arouter = require("./controllers/articleRouter.js");

//Initialize Express
var app = express();
var PORT = process.env.PORT || 8080;


//Set up body-parser, Handlebars
app.use(bodyParser.urlencoded({ extended: true }));
app.engine("handlebars", handlebars({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

//Set up Routing
app.use(express.static(__dirname + '/public'))
app.use("/", arouter);

//Initialize server
app.listen(PORT, function() {
	console.log('Listening on port ' + PORT);
});
