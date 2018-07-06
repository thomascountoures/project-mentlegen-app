const configValues = require("./config.json");
const mongoose = require("mongoose");

// configuration methods
module.exports = {

    setupStaticFilePaths: function(express, app) {
        // setup the static file paths
        app.use("/assets", express.static(__dirname + "/public"));
        app.use("/assets/styles", express.static(__dirname + "/public/styles"));
        app.use("/assets/images", express.static(__dirname + "/public/images"));
    },
    
    connectToMongoDB: function() {
        mongoose.connect(this._getDBConnectionString());
        mongoose.connection.on("error", function() {
            console.error("couldn't connect to the database, gnomesayin");
        });
        mongoose.connection.on("open", function(){
            console.log("Connected to the database sucka!!");
        });
    },

    _getDBConnectionString: function() {
        try {
            return "mongodb://" + 
                    configValues.DB_USER_NAME + 
                    ":" + 
                    configValues.DB_PASSWORD + 
                    configValues.DB_ADDRESS + 
                    "/" + 
                    configValues.DB_NAME;

        } catch(e) {
            console.error(e.message);
        }
    }
}