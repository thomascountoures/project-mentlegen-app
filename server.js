// express and body parser
const express = require('express');

// initialize express
const app = express();

// initialize http object
const http = require('http');

// custom setup module to bootstrap app
// set up database, seed database, setup
// body and cookie parsers, all and that stuff
const setup = require("./controllers/setup");

// initialize port to production or local port
const port = normalizePort(process.env.PORT || '1337');

// easy access to port - app.get("port") // whatever the port is
app.set("port", port);

/**
 * Create the HTTP server - specify that Express will be handling
 * all of the requests
 */
var server = http.createServer(app);

/**
 * Listen on port specified above
 */
server.listen(port);

/**
 * handles common system errors
 * these error are common to a Node.js backend
 */
server.on('error', function (error) {
    var portNumberMessage =  (typeof port === "string") ? "Pipe " + port : "Port " + port;

    // common errors
    // https://nodejs.org/api/errors.html#errors_error_code_1
    switch(error.code) {
        case "EADDRINUSE":
            console.error(portNumberMessage + " is already is use, try another port please (or not, lol)");
            break;
        case "EACCES":
            console.error(portNumberMessage + " is forbidden. You may not have the proper file access permissions. Basically, you tried getting a file and you're not allowed, gtfo lol");
            break;
        case "ECONNREFUSED":
            console.error("The machine with trying to use " + portNumberMessage + " is actively refusing the connection. Please try again later.");
            break;
        default:
            throw err;
    }
});

/**
 * Fires off when the server is listening
 */
server.on("listening", function() {
    console.log("Success, nodeJS, a C++ application, is listening on port " + port);
});


/**
 * Normalize Port number in case it is a string
 * @param {Boolean} val 
 */
function normalizePort(val) {
    var port = parseInt(val, 10);
    if(isNaN(port)) {
        return val;
    }

    if(port >= 0) {
        return port;
    }

    return false;
}


/**
 * Run setup, bootstrap the app 
 */
setup(express, app);

// send back initial hello
app.get("/", function(req, res) {
    res.send("Hello world!");
});