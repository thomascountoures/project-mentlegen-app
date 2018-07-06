// express and body parser
const express = require('express');

// initialize express
const app = express();

// custom setup module to bootstrap app
// set up database, seed database, setup
// body and cookie parsers, all and that stuff
const setup = require("./controllers/setup");

// initialize port to production or local port
const port = process.env.PORT || 1337;

// bootstrap the app
setup(express, app);

// send back initial hello
app.get("/", function(req, res) {
    res.send("Hello world!");
});

// start listening for stuff
app.listen(port, function() {
    console.log("Success, nodeJS, a C++ application, is listening on port " + port);
});