const express = require('express');
const postRouter = express.Router();
const passport = require('passport');
const mongoose = require('mongoose');
const PostModel = require('../../models/post');

function logger(req, res, next) {
    console.log(new Date(), req.method, req.url);
    next();
}

postRouter.use(logger);

/**
 * POST /posts/create
 * 
 * Creates new post
 */
postRouter.post("/create", passport.authenticate("jwt", { session: false }), function(req, res) {
    try {
        process.nextTick(function() {
            // remember: the jwt passport strategy defined in setup.js attaches a property to the request object 
            // called 'user', when it calls done(), so this property is accessed here by req.user . the value of this property
            // is specified in the done() method inside the strategy definition in setup.js
            // if the user is authenticated, the method calls done(null, (property to be passed to req.user, which is the user object found
            // when doing the database search) )
            if(req.user) {
                try {
                    var user = req.user;

                    // we need to save both the user and the post.
                    // create and save the new post in the Post Model collection.
                    // then, push that post onto the user.posts array and save the user.

                    const newPost = {
                        _id: mongoose.Types.ObjectId(), // note: mongoose.Types is used when saving things to the database. mongoose.Schema.Types is used when doing schema stuff.
                        title: req.body.title,
                        postBody: req.body.postBody,
                        author: user._id
                    };
                    
                    // we need to create a post instance and save it to the database first in the Posts collection
                    PostModel.create(newPost, function(err, post) {
                        if(err) throw err;
                    });

                    // then, we need to save the post instance to the user
                    user.posts.push(newPost);
                    
                    // then, we save the user
                    user.save(function(err) {
                        if(err) throw err;
                        res.status(200).json({ message: "Success! Post saved." });                        
                    });
                } catch(e) {
                    console.error(e.message);
                }
            }                        
        });
    } catch(e) {    
        console.error(e.message);
    }
});

/**
 * GET /posts
 * 
 * Get all posts
 */
postRouter.get("/", passport.authenticate("jwt", { session: false }), function(req, res, next) {
    try {
        process.nextTick(function() {
            // again, there will be a user property
            // if the user was authenticated
            // with the passport strategy
            if(req.user) {
                PostModel.find({}, function(err, posts) {
                    if(err) throw err;
                    res.status(200).json({ posts: posts });
                });
            } else {
                res.status(401).json({ message: "Unauthorized access. Please login first." });
            }
        });
    } catch(e) {
        console.error(e.message);
    }
});

/**
 * GET /posts/:id
 * 
 * Get a specific post by ID
 */
postRouter.get("/:id", passport.authenticate("jwt", { session: false }), function(req, res) {
    try {
        process.nextTick(function() {
            // again, there will be a user property
            // if the user was authenticated
            // with the passport strategy
            if(req.user) {
                PostModel.findOne({ _id: req.params.id })
                         .populate('author') // populate author field of post object. replaces author's ._id property with the full user object
                         .exec(function(err, post) { // finally, execute the callback for this model method
                            if(post) {
                                if(err) throw err;
                                res.status(200).json({ post: post });
                            } else {
                                res.status(404).json({ message: "Post not found" });
                            }
                         });
            } else {
                res.status(401).json({ message: "Unauthorized access. Please login first." });
            }
        });
    } catch(e) {
        console.error(e.message);
    }
});

// don't forget to export the router! 
// when calling app.use() and specifying
// this router, we need to provide the
// router method as the return value
// when we reference this file
module.exports = postRouter;