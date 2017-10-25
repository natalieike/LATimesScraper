//Dependencies
var express = require("express");
var arouter = express.Router();
var bodyParser = require("body-parser");
var mongojs = require("mongojs");
var request = require("request");
var cheerio = require("cheerio");
var moment = require("moment");

//Set up parsing
arouter.use(bodyParser.urlencoded({ extended: true }));
arouter.use(bodyParser.json());
arouter.use(bodyParser.text());
arouter.use(bodyParser.json({ type: "application/vnd.api+json" }));

//Initialize MongoJS
var databaseUrl = "latimesScraper";
var collections = ["articles"];
var db = mongojs(databaseUrl, collections);
db.on("error", function(error){
	console.log("Database Error: " + error);
})

//loops thru an array and eliminates any objects that are already in the database
var eliminateDupes = function(arr, index, cb){
	db.articles.find({link: arr[index].link}, function(err, data){
		if(err){
			console.log(err);
		}

		if(data.length > 0){
			arr.splice(index, 1);
		}
		else{
			index++;		
		}

		if(index < arr.length){
			eliminateDupes(arr, index, cb);
		}
		else{
			cb(err, arr);
		}
	});
};

//Re-direct to Scraper when page is first loaded
arouter.get("/", function(req, res){
	res.redirect("/scraper");
});

// Gets all of the LA Times articles from the database
arouter.get("/all", function(req, res){
	db.articles.find().sort({time:-1}, function(err, data){
		var renderObj = {
			articleObj: []
		};
		if(err){
			return console.log(err);
		}
		for(var i = 0; i < data.length; i++){
			renderObj.articleObj[i] = data[i];
			renderObj.articleObj[i].commentsLength = renderObj.articleObj[i].comments.length;
		}
		res.render("index", renderObj);
//		res.json(data);
	});
});

//Gets all of the LA Times articles from the database that are primary articles
arouter.get("/primary", function(req, res){
	db.articles.find({primary:true}).sort({time:-1}, function(err, data){
		if(err){
			return console.log(err);
		}
		res.render("index", data);
	});
});

//Gets all of the LA Times articles from the database that are secondary articles
arouter.get("/secondary", function(req, res){
	db.articles.find({primary:false}).sort({time:-1}, function(err, data){
		if(err){
			return console.log(err)
		}
		res.render("index", data);
	});
});

// Scrapes the data from the LA Times website
arouter.get("/scraper", function(req, res){
	request("http://www.latimes.com/", function(err, response, html){
		var $ = cheerio.load(html);
		var insertArticles = [];

//Scrapes the Primary Item articles - these will have headlines and slugs
		$("article.trb_outfit_primaryItem_article").each(function(i, element){
			var link = $(element).find("h2").find("a").attr("href").trim();
			var headline = $(element).find("h2").find("a").text().trim();
			var section = $(element).find("span.trb_outfit_categorySectionHeading").find("a").text().trim();
			var slug = $(element).find("span.trb_outfit_primaryItem_article_content_text").text().trim();
			var now = moment().format("YYYY MM DD hh:mm:ss");
			var newArticle = {
				link: link,
				headline: headline,
				slug: slug,
				section: section,
				comments: [],
				time: now,
				primary: true
			};
			if(link){
				insertArticles.push(newArticle);	
			}
		});

//Scrapes all of the listed headlines that are not Primary Item articles
		$("li.trb_outfit_list_headline").each(function(i, element){
			var link = $(element).find("a").attr("href").trim();
			var headline = $(element).find("a").find("h4").text().trim();
			var section = $(element).attr("data-content-section").trim();
			var now = moment().format("YYYY MM DD hh:mm:ss");
			var newArticle = {
				link: link,
				headline: headline,
				section: section,
				comments: [],
				time: now,
				primary: false
			};
			if(link){
				insertArticles.push(newArticle);	
			}
		});

		eliminateDupes(insertArticles, 0, function(err, artArr){
			if (artArr.length > 0){
				db.articles.insert(artArr, function(err, data){
					res.redirect("/all");
					insertArticles = [];
				});
			}
			else{
				insertArticles = [];
				res.redirect("/all");
			}
		});
	});
});

arouter.post("/comments/:id", function(req, res){
	var id = req.params.id;
	var commentText = req.body.commentText;
	var commentUser = req.body.commentUser;
	var now = moment().format("YYYY MM DD hh:mm:ss");
	var newComment = {
		commentText: commentText,
		commentUser: commentUser,
		commentTime: now
	}
	db.articles.find({_id: mongojs.ObjectId(id)}, function(err, data){
		console.log(data);
		commentArray = data[0].comments;
		commentArray.push(newComment);
		db.articles.update({_id: mongojs.ObjectId(id)}, {$set: {comments: commentArray}}, {}, function(err, result){
			res.redirect("/all");
		});
	});

});

module.exports = arouter;