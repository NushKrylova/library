'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient;
var ObjectId = require('mongodb').ObjectId;

//CONNECTION_STRING is your MongoDB Atlas database URI 
const CONNECTION_STRING = 'mongodb+srv:.../';

module.exports = function (app) {

  app.route('/api/books')
    .get(function (req, res) {
      MongoClient.connect(CONNECTION_STRING, function (err, client) {
        var collection = client.db().collection("books");
        collection.aggregate([
          {
            $project: {
              title: 1,
              commentcount: {
                $cond: { if: { $isArray: "$comments" }, then: { $size: "$comments" }, else: "NA" }
              }
            }
          }
        ]).toArray(function (err, docs) {
          if (err) {
            res.send(err)
          } else {
            res.json(docs);
          }
        });
      })
    })

    .post(function (req, res) {
      var title = req.body.title;
      if (!title) {
        return res.send("missing title");
      }
      MongoClient.connect(CONNECTION_STRING, function (err, client) {
        var collection = client.db().collection("books");
        collection.findOne({ "title": title }, function (err, doc) {
          if (doc) {
            return res.send('title already exists')
          } else {
            collection.insertOne({ "title": title, "comments": [] }, function (err, doc) {
              (!err) ? res.json({ "title": title, "_id": doc.insertedId }) : res.send(err);
            });
          }
        });
      });
    })

    .delete(function (req, res) {
      MongoClient.connect(CONNECTION_STRING, function (err, client) {
        var collection = client.db().collection("books");
        collection.remove(function (err, doc) {
          (!err) ? res.send('complete delete successful') : res.send(err);
        });
      });
    });



  app.route('/api/books/:id')
    .get(function (req, res) {
      var idString = req.params.id;
      let oid = new ObjectId(idString)
      MongoClient.connect(CONNECTION_STRING, function (err, client) {
        var collection = client.db().collection("books");
        collection.findOne({ "_id": oid }, function (err, doc) {
          if (doc) {
            res.send(doc)
          } else { res.send("no book exists") }
        });
      });
      //json res format: {"_id": bookid, "title": book_title, "comments": [comment,comment,...]}
    })

    .post(function (req, res) {
      var idString = req.params.id;
      let oid = new ObjectId(idString)
      var comment = req.body.comment;
      MongoClient.connect(CONNECTION_STRING, function (err, client) {
        var collection = client.db().collection("books");
        collection.findOneAndUpdate(
          { _id: oid },
          { $push: { comments: comment } },
          { returnOriginal: false },
          function (err, doc) {
            expect(err, 'database findAndModify error').to.not.exist;
            res.json(doc.value);
          })
      });
    })

    .delete(function (req, res) {
      var idString = req.params.id;
      MongoClient.connect(CONNECTION_STRING, function (err, client) {

        var collection = client.db().collection("books");
        collection.deleteOne({ "_id": new ObjectId(idString) }, function (err, doc) {
          (!err) ? res.send('deleted ' + idString) : res.send('could not delete ' + idString + ' ' + err);
        });
      });
    });

};
