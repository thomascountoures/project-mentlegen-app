const mongoose = require('mongoose');

// get mongoose schema
const Schema = mongoose.Schema;

const postSchema = new Schema({
    _id: Schema.Types.ObjectId,
   author: {
       type: mongoose.Schema.Types.ObjectId,
       ref: "User"
   },
   title: String,
   date: Date,
   postBody: String 
});

// create collection model
var PostModel = mongoose.model("Post", postSchema);

module.exports = PostModel;