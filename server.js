//Dependencies
var express = require("express");
var mongojs = require("mongojs");
var bodyParser = require("body-parser");
var handlebars = require("express-handlebars");
var path = require("path");
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

//Route for style.css
app.get("/style", function(req, res){
	res.sendFile(path.join(__dirname, "./public/assets/css/style.css"));
});

//Route for javascript
app.get("/javascript", function(req, res){
	res.sendFile(path.join(__dirname, "./public/assets/javascript/javascript.js"));
});

//Initialize server
app.listen(PORT, function() {
	console.log('Listening on port ' + PORT);
});
