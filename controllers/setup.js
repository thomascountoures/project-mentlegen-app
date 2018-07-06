const pug = require('pug');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const apiController = require('./api');
const passport = require('passport');
const cookieParser = require('cookie-parser');

// config information
const configValues = require('../config/config.json');
const configMethods = require('../config/config');

module.exports = function(express, app) {

    try {
        
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

        // bootstrap RESTful API endpoints
        apiController(app);

        app.set("view engine", "pug");

    } catch (e) {
        console.error(e.message);
    }
    


}