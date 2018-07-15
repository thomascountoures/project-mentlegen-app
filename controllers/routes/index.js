const UserModel = require("../../models/user");
const express = require('express');
const indexRouter = express.Router();
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");

const configValues = require("../../config/config.json");
const bcrypt = require("bcrypt");
const async = require("async");
const nodemailer = require("nodemailer");

// crypto is built into Node now, cool
const crypto = require('crypto');

// middleware for development, show date, request type and request URL
function logger(req, res, next) {
    console.log(new Date(), req.method, req.url);
    next();
}

indexRouter.use(logger);

/**
 * POST /signup
 * 
 * Example payload:
 * 
 * {
 *      "email" : "email@email.com",
 *      "password" : "password123"
 * }
 * 
 * Signs up user and sends back a JSON web token.
 * Only signs up user if user doesn't exist in DB.
 */
indexRouter.post("/signup", function(req, res) {
    process.nextTick(function() {
        UserModel.findOne({ "email" : req.body.email }, function(err, user) {
            if(err) throw err;
            try {
                // if the user is already signed up
                if(user) {
                    res.status(409).json({ message: "User already exists" });
                } else {
                    // the user isn't signed up, so uhh, go sign them up
                    // create new instance of user model (create a new document)
                    var newUser = new UserModel();
                    
                    newUser._id = new mongoose.Types.ObjectId();
                    newUser.email = req.body.email;
                    newUser.password = newUser.generateHash(req.body.password, 5);

                    newUser.save(function(err) {
                        if(err) throw err;

                        // create a JSON web token to send back to the user
                        // the JSON web token only contains the user's id
                        // yes, that's it
                        // no, I'm not kidding
                        var jwtPayload = { id: newUser.id };
                        var token = jwt.sign(jwtPayload, configValues.secretKey);
                        
                        res.json({ message: "signed up", token: token });

                    });
                }
            } catch(e) {
                console.error(e.message);
            }
        });

    })
});

/**
 * POST /login
 * 
 * Example Payload
 * 
 * {
 *      "email" : "email@email.com",
 *      "password" : "password123"
 * }
 * 
 * Logs in user and sends back a JSON web token.
 * Verifies user exists and password is valid.
 */
indexRouter.post("/login", function(req, res) {
    process.nextTick(function() {

        if(req.body.email && req.body.password) {
            var email = req.body.email; 
            var password = req.body.password;

            UserModel.findOne({ email: email }, function(err, user) {
                if(err) throw err;
                if(!user) res.status(401).json({ message: "User not found" });

                // if the user has a valid password, create a new json web token
                // and send it back
                try {
                    if(user.validatePassword(password)) {
                        try {
                            
                            var jwtPayload = { id: user.id };
                            var token = jwt.sign(jwtPayload, configValues.secretKey);
                            
                            res.status(200).json({ message: "login OK", token: token });
    
                        } catch(e) {
                            console.error(e.message);
                        }
                    } else {
                        // the user doesn't have a valid password.
                        // this is possibly your ex-gf trying to
                        // hack you. don't let her in!
                        res.status(401).json({ message: "invalid password" });
                    }
                } catch(e) {
                    console.error(e.message);
                }
                
                
            });
        } else {
            res.status(422).json({ message: "The email or password is missing from the payload. Please try again." })
        }


    });
    

});

/**
 * POST /forgotPassword
 * 
 * Example payload:
 * 
 * {
 *      email: "email@email.com"
 * }
 * 
 * Locates user by email. Creates a random hash string token
 * that serves as the temporary URL to be sent to a user's
 * email address they provided. Temporarily attaches that
 * token to the user document instance in the DB, as well
 * as an expiry property for resetting their password.
 * Lastly, sends a user an email with the temporary link
 * to reset their password using a combination of Nodemailer
 * and the SendGrid service.
 */
indexRouter.post("/forgotPassword", function(req, res) {

    process.nextTick(function() {

        async.waterfall([

            // STEP 1: generate a random string with crypto
            // this string will bb used as the reset password token
            // we are going to attach this token as a property to
            // the user instance (document) in the DB
            function(done) {
                try {
                    crypto.randomBytes(20, function(err, buf) {
                        let token = buf.toString('hex');
                        return done(err, token);
                    });
                } catch(e) {
                    console.error(e.message);
                }                    
            },

            // STEP 2: locate a user by the email address provided
            // if a user is found, set the token as a property on
            // that user instance (document). also set a reset password
            // expires property to around 1 hour
            function(token, done) {
                try {
                    UserModel.findOne({ email: req.body.email }, function(err, user) {
                        if(!user) return res.status(401).json({ message: "no user with that email found" });

                        // set token property
                        user.resetPasswordToken = token;

                        // set token expires property to one hour
                        user.resetPasswordExpires = Date.now() + 3600000;

                        // save document instance to the DB
                        user.save(function(err) {
                            if(err) throw err;
                            return done(err, token, user);
                        });
                    });
                } catch(e) {
                    console.error(e.message);
                }                    
            },

            // STEP 3: configure and use a combination of Nodemailer and
            // SendGrid to email user a reset password link
            function(token, user) {
                try {
                    let transporter = nodemailer.createTransport({
                        service: "SendGrid",
                        auth: {
                            user: configValues.MAILER_USER,
                            pass: configValues.MAILER_PASSWORD
                        }
                    });

                    let mailOptions = {
                        from: "noreply@mentlgenproject.com",
                        to: user.email,
                        subject: "Mentlegen - Password Reset",
                        // TODO: write HTML message that user gets in email
                        html: "You are receiving this email because you (or someone else) requested to reset the password for <b>" + user.email + "</b>." + "\n\n" + 
                            "Please click the following link to reset your password:\n\n" +
                            // this route handled in controllers/routes.js
                            "http://" + req.headers.host + "/resetPassword/" + token + "\n\n" + 
                            "If this was not you, please ignore this email, and your password will not be changed."
                    };

                    transporter.sendMail(mailOptions, function(err, info) {
                        if(err) throw err;
                        console.log("Message sent to " + req.body.email);
                        res.status(200).json({ message: "Success! Message sent to " + req.body.email });
                    });
                } catch(e) {
                    console.error(e.message);
                }
            },

        ])

    })

});

/**
 * POST /resetPassword/:token
 * 
 * Example payload:
 * 
 * {
 *      "password" : "password123"
 * }
 * 
 * Locates a user via the URI token and checks to see if the token has expired or not.
 * If everything is valid, changes user document with new password and resets the
 * resetPasswordToken and resetPasswordExpires property. Sends email using a combination
 * of Nodemailer and SendGrid.
 */
indexRouter.post("/resetPassword/:token", function(req, res) {
    try {
        process.nextTick(function() {
            async.waterfall([

                // STEP 1: Locate user and check if their token is valid, and that the token has not yet expired
                // If a user is found, set both resetPasswordToken and resetPasswordExpires property back to null
                function(done) {
                    UserModel.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
                        if(err) throw err;
                        if(user) {
                            try {
                                // encrypt password
                                user.password = user.generateHash(req.body.password, 5);

                                // set resetPasswordToken and resetPasswordExpires properties to null
                                user.resetPasswordToken = null;
                                user.resetPasswordExpires = null;
                                
                                // save user document to DB
                                user.save(function(err) {
                                    if(err) throw err;
                                    return done(null, user);
                                });
                            } catch(e) {
                                console.error(e.message);
                            }
                            
                        } else {                                
                            res.status(401).json({ message: "User not found. Please ensure token is valid and has not expired yet." });
                        }
                    });
                },

                // STEP 3: configure and use a combination of Nodemailer and
                // SendGrid to email user that their password has been succesfully
                // reset
                function(user) {
                    let transporter = nodemailer.createTransport({
                        service: "SendGrid",
                        auth: {
                            user: configValues.MAILER_USER,
                            pass: configValues.MAILER_PASSWORD
                        }
                    });

                    let mailOptions = {
                        to: user.email,
                        from: "noreply@mentlgenproject.com",                          
                        subject: "Mentlegen - Password Reset",
                        // TODO: write HTML message that user gets in email
                        html: "Success. Your password has been reset. - Team Mentlegen"
                    };

                    transporter.sendMail(mailOptions, function(err, info) {
                        if(err) throw err;
                        console.log("Message sent to " + user.email);
                        res.status(200).json({ message: "Message sent to " + user.email });
                    });
                }

            ])
        });            
    } catch(e) {
        console.error(e.message);
    }
});

/**
 * GET /resetPassword/:token
 * 
 * This link is clicked via the user's email message
 * the user is taken to a page where there are two
 * fields: new password and confirm password
 */
indexRouter.get("/resetPassword/:token", function(req, res) {
    try {
        // check if user exists with the password reset token, and that the token has not expired yet
        // if user is found, redirect user to page to setup a new password
        UserModel.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
            if(err) throw err;
            if(user) {
                return res.redirect("/resetPasswordForm");
            } else {
                res.status(401).json({ message: "User not found" });                    
            }
        });
    } catch(e) {
        console.error(e.message);
    }
});




/**
 * GET - /API/SEED
 * 
 * Does initial seed of database. Is a GET
 * so developer can do this right in the
 * browser's URL. Only for development 
 * purposes at the moment.
 * 
 * The seed only works if the database
 * is empty.
 */
indexRouter.get("/seed", function(req, res) {      

    UserModel.count({}, function(err, count) {
        if(err) throw err;
        // if there is no data in the database, then seed it
        // else tell the user there are documents that already exist
        if(count === 0) {
            UserModel.create(configValues.SEED_DATA, function(err, results) {
                if(err) throw err;
                try {
                    res.send(results);
                    console.log("Success! Seeding into the database complete");
                } catch(e) {
                    console.error(e.message);
                }
            });                
        } else {
            res.send({ message: "Documents already exist in database. Seeding did not occur." });
            console.log("The database already has documents");
        }
    });
});

// don't forget to export the router! 
// when calling app.use() and specifying
// this router, we need to provide the
// router method as the return value
// when we reference this file
module.exports = indexRouter;