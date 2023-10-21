// Require packages.  
const express = require('express');

// Require functions from reviewController.js.  
const reviewController = require('./../controllers/reviewController');

// Require functions from authController.js.  
const authController = require('./../controllers/authController');

// Create a router for the reviews.  Set mergeParams to true so the router has access to the parameters of the parent route.  
const router = express.Router({ mergeParams: true });

// Use protect as a middleware to protect all the routes after the below line of code.  
router.use(authController.protect);

// When the GET request is sent to /api/v1/reviews or /api/v1/tours/:tourId/reviews, invoke getAllReviews.  
// When the POST request is sent to /api/v1/reviews or /api/v1/tours/:tourId/reviews, restrictTo function (with 'user' as argument), 
// and setTourUserIds as middleware, because only user can create reviews or /api/v1/tours/:tourId/reviews, then invoke createReview.  
router.route('/')
    .get(reviewController.getAllReviews)
    .post(authController.restrictTo('user'), reviewController.setTourUserIds, reviewController.createReview);

// When the GET request is sent to /api/v1/reviews/:id or /api/v1/tours/:tourId/reviews/:id, invoke getReview.  
// When the PATCH request is sent to /api/v1/reviews/:id or /api/v1/tours/:tourId/reviews/:id, use restrictTo as middleware, pass in user and admin 
// as arguments so only users and admins can update a review, then invoke updateReview.  
// When the DELETE request is sent to /api/v1/reviews/:id or /api/v1/tours/:tourId/reviews/:id, use restrictTo as middleware, pass in user and admin 
// as arguments so only users and admins can delete a review, then invoke deleteReview.  
router.route('/:id')
    .get(reviewController.getReview)
    .patch(authController.restrictTo('user', 'admin'), reviewController.updateReview)
    .delete(authController.restrictTo('user', 'admin'), reviewController.deleteReview);

module.exports = router;