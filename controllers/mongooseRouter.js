//Dependencies
var express = require("express");
var arouter = express.Router();
var bodyParser = require("body-parser");
var mongoose = require("mongoose");
var request = require("request");
var cheerio = require("cheerio");
var moment = require("moment");

// Require all models
var db = require("../models");

//Set up parsing
arouter.use(bodyParser.urlencoded({ extended: true }));
arouter.use(bodyParser.json());
arouter.use(bodyParser.text());
arouter.use(bodyParser.json({ type: "application/vnd.api+json" }));

//Initialize Mongo Database via Mongoose
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/latimesScraper"

mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI, {
  useMongoClient: true
});

//loops thru an array and eliminates any objects that are already in the database
var eliminateDupes = function(arr, index, cb){
	db.Article.find({link: arr[index].link}).then(function(data){
		if(data.length > 0){
			index++;
			if(index < arr.length){
				eliminateDupes(arr, index, cb);
			}
			else{
				cb(arr);
			}
		}
		else{
			db.Article.create(arr[index]).then(function(data){
				index++;
				if(index < arr.length){
					eliminateDupes(arr, index, cb);
				}
				else{
					cb(arr);
				}
			}).catch(function(err){
				console.log(err);
	      res.status(500).end();
			});			
		}
	}).catch(function(err){
		console.log(err);
      res.status(500).end();
 	});
};

//Re-direct to Scraper when page is first loaded
arouter.get("/", function(req, res){
	res.redirect("/scraper");
});

// Gets all of the LA Times articles from the database
arouter.get("/all", function(req, res){
	db.Article.find({}).populate("comments").sort({time:-1}).then(function(data){
		var renderObj = {
			articleObj: data
		};
		console.log(renderObj.articleObj);
		for(var i = 0; i < renderObj.articleObj.length; i++){
			if(renderObj.articleObj[i].comments){
				renderObj.articleObj[i].commentsLength = renderObj.articleObj[i].comments.length;
			}else{
				renderObj.articleObj[i].commentsLength = 0;
			}
		}
		res.render("index", renderObj);
//		res.json(renderObj);
	}).catch(function(err){
		console.log(err);
    res.status(500).end();
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
				time: now,
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
				time: now,
			};
			if(link){
				insertArticles.push(newArticle);	
			}
		});

		eliminateDupes(insertArticles, 0, function(artArr){
				res.redirect("/all");
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
	db.Comment.create(newComment).then(function(data){
    return db.Article.findOneAndUpdate({_id: id}, { $push: { comments: data._id } }, { new: true })
    .then(function(dbArticle) {
      // If the Library was updated successfully, send it back to the client
      res.redirect("/all");
    })
    .catch(function(error) {
			console.log(error);
	    res.status(500).end();
    });
	}).catch(function(err){
		console.log(err);
    res.status(500).end();
	});
});

module.exports = arouter;