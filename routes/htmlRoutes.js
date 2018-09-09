var db = require("../models");

var axios = require("axios");
var cheerio = require("cheerio");


module.exports = function (app) {
  // Load index page
  app.get("/", function (req, res) {
    db.Article.find({})
      .then(function (response) {
        res.render("index", { data: response });
      }).catch(function (error) {
        res.json(error);
      });
  });

  // A GET route for scraping the echoJS website
  app.get("/scrape", function (req, res) {
    var added = [];
    axios.get("https://www.fastcompany.com/co-design").then(function (response) {
      // Then, we load that into cheerio and save it to $ for a shorthand selector
      var $ = cheerio.load(response.data);

      // Now, we grab every h2 within an article tag, and do the following:
      $("div article.card--small").each(function (i, element) {
        // Save an empty result object
        var result = {};
        var add;
        // Add the text and href of every link, and save them as properties of the result object
        result.title = $(this)
          .children("a")
          .attr("title");
        result.link = "https://www.fastcompany.com" + $(this).children("a").attr("href");;

        db.Article.find({ title: result.title }, function (err, res) {
          if (res.length) {
            console.log(result.title + " already exists")
          } else {
            // Create a new Article using the `result` object built from scraping
            db.Article.create(result)
              .then(function (dbArticle) {
                // View the added result in the console
                console.log(dbArticle);
                added.push(result);
              })
              .catch(function (err) {
                // If an error occurred, send it to the client
                return res.json(err);
              });
          }
        });
      });
    }).then(function () {
      if (added.length) {
        var length = added.length;
        res.render("scrape", {
          msg: length + " articles added!"
        })
      } else {
        res.render("scrape", {
          msg: "Articles are up to date!"
        })
      }
    })

  });

  // Load example page and pass in an example by id
  app.get("/comment/:id?", function (req, res) {
    db.Article.find({ _id: req.params.id })
      .then(function (response) {
        res.render("comment", { data: response[0] });
      }).catch(function (error) {
        res.json(error);
      });

  });

  app.get("/viewcomments/:id?", function (req, res) {

    db.Article.findOne({ _id: req.params.id })
      .populate("comments")
      .then(function (response) {

        res.render("viewcomments", { data: response });

      }).catch(function (error) {
        res.json(error);
      });

  });

  app.post("/submit/:id", function (req, res) {
    db.Comment.create(req.body)
      .then(function (dbComment) {
        // If a Note was created successfully, find one User (there's only one) and push the new Note's _id to the User's `notes` array
        // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
        // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
        return db.Article.findOneAndUpdate({ _id: req.params.id }, { $push: { comments: dbComment._id } }, { new: true });
      })
      .then(function () {
        // db.Article.find({})
        //   .then(function (response) {
        //     res.render("index", { data: response });
        //   }).catch(function (error) {
        //     res.json(error);
        //   });
        window.location.href = "/"
      })
      .catch(function (err) {
        // If an error occurs, send it back to the client
        res.json(err);
      });
  });

  // Render 404 page for any unmatched routes
  app.get("*", function (req, res) {
    res.render("404");
  });
};
