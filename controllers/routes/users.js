const express = require('express');
const userRouter = express.Router();
const passport = require('passport');
const mongoose = require('mongoose');
const UserModel = require('../../models/user');


userRouter.get("/", passport.authenticate('jwt', { session: false } ), function(req, res) {

});

module.exports = userRouter;