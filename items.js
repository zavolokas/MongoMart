/*
  Copyright (c) 2008 - 2016 MongoDB, Inc. <http://mongodb.com>

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/


var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');


function ItemDAO(database) {
    "use strict";

    this.db = database;

    this.getCategories = function (callback) {

        //returns the total number of items in each category. The documents in the array

        var item = this.db.collection('item');

        item.aggregate([
            {
                $group: {
                    "_id": "$category",
                    "num": { "$sum": 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ], function (err, result) {
            assert.equal(err, null);

            // In addition to the categories created by aggregation query,
            // include a document for category "All" in the array of categories
            // The "All" category contains the total number of items across 
            // all categories as its value for "num". 
            var total = 0;
            var category = {
                _id: "All",
                num: total
            };

            var categories = [category];

            for (var r in result) {
                categories.push(result[r]);
                categories[0].num += result[r].num;
            }
            callback(categories);
        });
    }


    this.getItems = function (category, page, itemsPerPage, callback) {
        var item = this.db.collection('item');

        var aggregatoinPipeline = [{ $match: { "category": category } },
        { $sort: { "_id": 1 } },
        { $skip: page * itemsPerPage },
        { $limit: itemsPerPage }];

        if (category == "All") {
            aggregatoinPipeline.shift();
        }

        item.aggregate(aggregatoinPipeline,
            function (err, result) {
                assert.equal(err, null);
                callback(result);
            }
        );
    }


    this.getNumItems = function (category, callback) {
        // Determines the number of items in a category
        // and pass the count to the callback function. The count is used in
        // the mongomart application for pagination. The category is passed
        // as a parameter to this method.

        var itemCollection = this.db.collection('item');
        var aggregatoinPipeline = [
            { $match: { "category": category } },
            { $group: { _id: null, num: { "$sum": 1 } } },
        ];

        if (category == "All")
            aggregatoinPipeline.shift();

        itemCollection.aggregate(aggregatoinPipeline, function (err, result) {
            assert.equal(err, null);
            var numItems = result[0].num;
            callback(numItems);
        });
    }


    this.searchItems = function (query, page, itemsPerPage, callback) {
        // Performs a text search against the "item" collection
        // Using the value of the query parameter passed to searchItems(),

        // Since it depends on a text index, a SINGLE text index on title, slogan, and
        // description must be created in the mongo shell as follows:
        //
        //     db.item.createIndex({
        //         "title":"text",
        //         "slogan": "text",
        //         "description": "text"
        //     });

        var items = this.db.collection("item");

        items.aggregate([
            { $match: { $text: { $search: query } } },
            { $sort: { "_id": 1 } },
            { $skip: page * itemsPerPage },
            { $limit: itemsPerPage }
        ], function (err, result) {
            assert.equal(err, null);
            callback(result);
        });
    };

    this.getNumSearchItems = function (query, callback) {
        // Counts the number of items in the "item" collection matching
        // a text search using the value of the query parameter passed to this
        // method.

        var items = this.db.collection("item");

        items.aggregate([
            { $match: { $text: { $search: query } } },
            { $group: { "_id": null, num: { $sum: 1 } } },
        ], function (err, result) {
            assert.equal(err, null);
            callback(result[0].num);
        });
    };


    this.getItem = function (itemId, callback) {
        var items = this.db.collection("item");

        items.findOne({ "_id": itemId }, function (err, result) {
            assert.equal(err, null);
            console.log("getItem:");
            console.log(result);
            callback(result);
        });
    };


    this.getRelatedItems = function (callback) {
        this.db.collection("item").find({})
            .limit(4)
            .toArray(function (err, relatedItems) {
                assert.equal(null, err);
                callback(relatedItems);
            });
    };


    this.addReview = function (itemId, comment, name, stars, callback) {
        // Updates the appropriate document in the "item" collection with a new review,
        // using the itemId parameter. Reviews are stored as an array value for the key
        // "reviews". Each review has the fields: "name", "comment", "stars", and "date".

        var items = this.db.collection("item");

        var review = {
            comment: comment,
            name: name,
            stars: stars,
            date: Date.now()
        };

        items.findOneAndUpdate(
            { _id: itemId },
            { $push: { "reviews": review } },
            { returnOriginal: false },
            function (err, result) {
                assert.equal(err, null);
                callback(result.value);
            });
    };
}

module.exports.ItemDAO = ItemDAO;
