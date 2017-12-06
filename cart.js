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


function CartDAO(database) {
    "use strict";

    this.db = database;


    this.getCart = function (userId, callback) {

        var card = this.db.collection("cart");

        card.findOne({ "userId": userId }, function (err, result) {
            assert.equal(err, null);
            callback(result);
        });
    };


    this.itemInCart = function (userId, itemId, callback) {

        // Determines whether or not the cart associated
        // with the userId contains an item identified by itemId. If the cart
        // does contains the item, passes the item to the callback. If it does not,
        // passes the value null to the callback.

        var cart = this.db.collection("cart");
        cart.findOne({ userId: userId, "items._id": itemId }, { "items.$": 1 }, function (err, result) {
            assert.equal(err, null);

            console.log(result);

            if (result && result.items && result.items.length > 0)
                callback(result.items[0]);
            else callback(null);
        });
    };

    this.addItem = function (userId, item, callback) {

        // Will update the first document found matching the query document.
        this.db.collection("cart").findOneAndUpdate(
            { userId: userId },
            { "$push": { items: item } },
            {
                upsert: true,
                returnOriginal: false
            },
            // Because we specified "returnOriginal: false", this callback
            // will be passed the updated document as the value of result.
            function (err, result) {
                assert.equal(null, err);
                // To get the actual document updated we need to access the
                // value field of the result.
                callback(result.value);
            });
    };


    this.updateQuantity = function (userId, itemId, quantity, callback) {

        if (quantity > 0) {
            this.db.collection("cart").findOneAndUpdate(
                { userId: userId, "items._id": itemId },
                { $set: { "items.$.quantity": quantity } },
                { returnOriginal: false },
                function (err, result) {
                    assert.equal(err, null);
                    callback(result.value);
                }
            );
        } else{
            this.db.collection("cart").findOneAndUpdate(
                { userId: userId},
                { $pull: { "items": {"_id":itemId } }},
                { returnOriginal: false },
                function (err, result) {
                    assert.equal(err, null);
                    callback(result.value);
                }
            );
        }
    };
}


module.exports.CartDAO = CartDAO;
