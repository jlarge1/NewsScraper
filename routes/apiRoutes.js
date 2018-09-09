// Our scraping tools
// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server

var db = require("../models");


module.exports = function (app) {

  app.get("/api/articles", function (req, res) {
    db.Article.find()
      .then(function (dbArticle) {
        res.json(dbArticle);
      }).catch(function (error) {
        res.json(error);
      });
  });

  // Create a new example
  app.get("/api/articles/comments", function (req, res) {

    db.Article.find({})
      .populate("comments")
      .then(function (dbArticle) {
        res.json(dbArticle);
      }).catch(function (error) {
        res.json(error);
      });
  });


};
