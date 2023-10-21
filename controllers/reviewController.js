// Require the Review model from reviewModel.js.  
const Review = require('./../models/reviewModel');

// Require functions from handlerFactory.js.  
const factory = require('./handlerFactory');

// If there's no tour from req.body, tour equals to the tourId parameter.  
// If there's no user from req.body, user is equal to req.user.id, which is retrieved from the protect middleware.  
exports.setTourUserIds = (req, res, next) => {
    if(!req.body.tour) {
        req.body.tour = req.params.tourId;
    }
    if(!req.body.user) {
        req.body.user = req.user.id;
    }
    next();
}

// Invoke getAll, pass in Review as argument.  
exports.getAllReviews = factory.getAll(Review);

// Invoke createOne, pass in Review as argument.  
exports.createReview = factory.createOne(Review);

// Invoke getOne, pass in Review as argument.  
exports.getReview = factory.getOne(Review);

// Invoke updateOne, pass in Review as argument.  
exports.updateReview = factory.updateOne(Review);

// Invoke deleteOne, pass in Review as argument.  
exports.deleteReview = factory.deleteOne(Review);