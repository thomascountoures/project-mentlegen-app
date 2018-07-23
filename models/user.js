const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// get mongoose schema
const Schema = mongoose.Schema;

// create userSchema
const userSchema = new Schema({
    _id: mongoose.Schema.Types.ObjectId,
    email: String,
    password: String,
    resetPasswordToken: String,
    resetPasswordExpires: Date,
    posts: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Post"
        }
    ]
});

// define methods for each instance of the User collection (each instance of UserModel)
userSchema.methods.generateHash = function(passwordString, saltRounds) {
    // encrypt password, don't let people hack your shit, like your ex-gf
    try {
        return bcrypt.hashSync(passwordString, bcrypt.genSaltSync(saltRounds));
    } catch(e) {
        console.error(e.message);
    }
    
}
// are you who you say you are?
userSchema.methods.validatePassword = function(passwordString) {
    return bcrypt.compareSync(passwordString, this.password);
}

// create UserModel
// remember: instances of models are called documents!
// a Model basically doubles as a collection
const UserModel = mongoose.model("User", userSchema);

// export userModel
module.exports = UserModel;