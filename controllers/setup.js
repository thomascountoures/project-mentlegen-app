const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const cookieParser = require('cookie-parser');
const passportJWT = require("passport-jwt");
const UserModel = require('../models/user')

// config information
const configValues = require('../config/config.json');
const configMethods = require('../config/config');

// routing information
const routesIndex = require("./routes");
const postRoutes = require("./routes/posts");

module.exports = function(express, app) {

    try {

        
        // define JWT strategies for passport
        const ExtractJWT = passportJWT.ExtractJwt;
        const JWTStrategy = passportJWT.Strategy;

        var jwtOptions = {
            jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
            secretOrKey: configValues.secretKey
        };

        // this strategy is used for EVERY route that we specify protected
        // by our passport strategy. when you see passport.authenticate('jwt'), etc.
        // as middleware on a route, it will run through here first to make sure 
        // that the user is authenti-ma-cated
        var strategy = new JWTStrategy(jwtOptions, function(jwtPayload, done) {
            
            console.log("payload received", jwtPayload);

            // look up user by provided id in the json web token
            UserModel.findById(jwtPayload.id, function(err, user) {
                if(err) throw err;
                try {
                    if(err) return done(err, false);
                    
                    // remember: passport attaches a property to the request object called 'user',
                    // so this property is accessed here in the next middleware piece via req.user . 
                    // the value of this property is specified in the second parameter of the done() method here                    
                    if(user) return done(null, user);                    
                    
                    return done(null, false);                    
                } catch(e) {
                    console.error(e.message);
                }
            });

        });

        // tell passport to use JWT strategy
        passport.use(strategy);
        
        // setup bodyparser to parse json and
        // urlencoded POST datatypes
        app.use(bodyParser.json());
        app.use(bodyParser.urlencoded( { extended: true }));

        // initialize cookie parser
        app.use(cookieParser());

        // initialize passport
        app.use(passport.initialize());

        // setup static file paths
        configMethods.setupStaticFilePaths(express, app);

        // setup connection to mongo DB
        configMethods.connectToMongoDB();        

        // define routes
        app.use("/", routesIndex); // login, signup, etc.
        app.use("/posts", postRoutes); // user create post, user delete post, etc.

        app.set("view engine", "pug"); // probably going to use react, but whatever

    } catch (e) {
        console.error(e.message);
    }
    


}