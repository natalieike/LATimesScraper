//Dependencies
var mongoose = require("mongoose");
var Schema = mongoose.Schema;

// Initialize ArticleSchema
var ArticleSchema = new Schema({
  headline: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true
  },
  section: String,
  time: {
    type: Date,
    default: Date.now
  },
  // Reference Comment model
  comments: [{
    type: Schema.Types.ObjectId,
    ref: "Comment"
  }]
});

// Create Article Model
var Article = mongoose.model("Article", ArticleSchema);

// Export the Article model
module.exports = Article;