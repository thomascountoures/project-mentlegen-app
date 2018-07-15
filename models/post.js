const mongoose = require('mongoose');

// get mongoose schema
const Schema = mongoose.Schema;

const postSchema = new Schema({
   author: {
       type: Schema.Types.ObjectId,
       ref: "User"
   },
   title: String,
   date: Date,
   postBody: String 
});

// create collection model
var PostModel = mongoose.model("Post", postSchema);

module.exports = PostModel;