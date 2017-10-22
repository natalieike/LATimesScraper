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

var eliminateDupes = function(arr, index, cb){
	console.log(arr[index].link);
	db.articles.find({link: arr[index].link, headline: arr[index].headline}, function(err, data){
		if(data.length > 1){
			arr.splice(index, 1);
			console.log("found a dupe");
			console.log(arr);
		}
		index++;
		if(index < arr.length){
			eliminateDupes(arr, index, cb);
		}
		else{
			cb(err, arr);
		}
	});
};

// Gets all of the LA Times articles from the database
arouter.get("/all", function(req, res){
	db.articles.find().sort({time:-1}, function(err, data){
		if(err){
			return console.log(err);
		}
//		res.render("index", data);
		res.json(data);
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
			var link = $(element).find("h2").find("a").attr("href");
			var headline = $(element).find("h2").find("a").text();
			var section = $(element).find("span.trb_outfit_categorySectionHeading").find("a").text();
			var slug = $(element).find("span.trb_outfit_primaryItem_article_content_text").text();
			var now = moment().format("YYYY MM DD hh:mm:ss");
			var newArticle = {
				link: link,
				headline: headline,
				slug: slug,
				section: section,
				time: now,
				primary: true
			};
/*			db.articles.find({link: link}, function(err, data){
				if(data.length <1){
					console.log("new article");
					insertArticles.push(newArticle);
				}		
			});
*/
			if(link){
				insertArticles.push(newArticle);	
			}
		});

		//Scrapes all of the listed headlines that are not Primary Item articles - these will only have headlines - no slugs
		$("li.trb_outfit_group_list_item").each(function(i, element){
			var link = $(element).find("a.outfit_related_ListTitle_a").attr("href");
			var headline = $(element).find("a.outfit_related_ListTitle_a").text();
			var section = $(element).attr("data-content-section");
			var now = moment().format("YYYY MM DD hh:mm:ss");
			var newArticle = {
				link: link,
				headline: headline,
				section: section,
				time: now,
				primary: false
			};
/*			db.articles.find({link: link}, function(err, data){
				if(data.length <1){
					insertArticles.push(newArticle);
				}		
			});
*/
			if(link){
				insertArticles.push(newArticle);	
			}
		});
		eliminateDupes(insertArticles, 0, function(err, artArr){
			console.log(artArr);
			if (artArr.length > 0){
				db.articles.insert(artArr, function(err, data){
					console.log("in insert");
					res.redirect("/all");
				});
			}
			else{
				res.redirect("/all");
			}
		});
	});
});

module.exports = arouter;