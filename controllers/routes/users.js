const express = require('express');
const userRouter = express.Router();
const passport = require('passport');
const mongoose = require('mongoose');
const UserModel = require('../../models/user');

/**
 * GET /users
 * 
 * Gets all users
 * 
 * Optional: /users/?populatePosts=true
 * 
 * Gets all users and populates the posts property,
 * showing the posts in detail (not just the ID's)
 */
userRouter.get("/", passport.authenticate('jwt', { session: false } ), function(req, res) {
    process.nextTick(function() {
        try {
            // again, req.user is populated if the user is authenticated.
            // this happens from the JWT strategy in setup.js
            if(req.user) { 
                // you can show all the users and their posts by adding ?populatePosts=true to the API call
                if(req.query.populatePosts === "true") {
                    UserModel.find({})
                             .populate('posts')
                             .exec(function(err, users) {
                                if(err) throw err;
                                res.status(200).json({ users: users });
                             });
                } else {
                    UserModel.find({}, function(err, users) {
                        if(err) throw err;
                        if(users) {
                            res.status(200).json({ users: users });
                        } else {
                            res.status(404).json({ message: "Users not found. Please try again later." });
                        }                    
                    });
                }                                                                               
            } else {
                res.status(404).json({ message: "Unauthorized user. Please login." });
            }
        } catch(e) {
            console.error(e.message);
        }
    });        

});


/**
 * GET /users/:id
 * 
 * Gets a specific user
 */
userRouter.get("/:id", passport.authenticate('jwt', { session: false }), function(req, res) {
    process.nextTick(function() {
        try {
            if(req.user) {
                UserModel.findOne({ _id: req.params.id })
                         .populate('posts')
                         .exec(function(err, user) {
                            if (err) throw err;
                            if (user) {
                                res.status(200).json({ user: user });
                            } else {
                                res.status(404).json({ message: "User not found. Please try again later. "});
                            }                            
                         });
            } else {
                res.status(404).json({ message: "Unauthorized user. Please login." });
            }
        } catch(e) {
            console.error(e.message);
        }
    });
});

module.exports = userRouter;