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
                    user.save(function(err) {
                        if(err) throw err;

                        var post = new PostModel();

                        post.title = req.body.title;
                        post.postBody = req.body.postBody;
                       
                        post.author = user._id;

                        post.save(function(err) {
                            if(err) throw err;
                            res.status(200).json({ message: "Success! Post saved." })
                        });
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

// don't forget to export the router! 
// when calling app.use() and specifying
// this router, we need to provide the
// router method as the return value
// when we reference this file
module.exports = postRouter;