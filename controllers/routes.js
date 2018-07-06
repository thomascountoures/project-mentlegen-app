const UserModel = require('../models/userModel');

module.exports = function(app) {

    // this link is clicked via the user's email message
    // the user is taken to a page where there are two
    // fields: new password and confirm password
    app.get("/resetPassword/:token", function(req, res) {
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

}