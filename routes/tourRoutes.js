// Require the express module.  
const express = require('express');

// Import the controllers functions from tourController.js.  
const tourController = require('./../controllers/tourController');

// Import the controllers functions from authController.js.  
const authController = require('./../controllers/authController');

// Import the the router from reviewRouter.js.  
const reviewRouter = require('./../routes/reviewRoutes');

// Create a router for the tours.  
const router = express.Router();

// Use reviewRouter as a middle if the router is localhost:3000/api/v1/tours/:tourId/reviews.  
router.use('/:tourId/reviews', reviewRouter);

// When the GET request is sent to /api/v1/tours/top-5-cheap, invoke the aliasTopTours middleware function, then invoke getAllTours.  
router.route('/top-5-cheap').get(tourController.aliasTopTours, tourController.getAllTours);

// When the GET request is sent to /api/v1/tours/tour-stats, invoke getTourStats.  
router.route('/tour-stats').get(tourController.getTourStats);

// When the GET request is sent to /api/v1/tours/monthly-plan/:year, use protect function and restrictTo function (with 'admin', 'lead-guide', 'guide' as argument)
// as middleware, because only admin, lead-guide, and guide type users can see the monthly plan, then invoke getMonthlyPlan.  
router.route('/monthly-plan/:year')
    .get(authController.protect, authController.restrictTo('admin', 'lead-guide', 'guide'), tourController.getMonthlyPlan);

// :distance is the tours within the distance (as Number), :latlng is the latitude of longitude of the center, 
// :unit is the unit of length for the distance such as km or mi.  For example, /tours-within/400/center/34.12,-118.12/unit/mi.  
// When a GET request is submitted to /api/v1/tours/tours-within/:distance/center/:latlng/unit/:unit, invoke getToursWithin.  
router.route('/tours-within/:distance/center/:latlng/unit/:unit').get(tourController.getToursWithin);

// When a GET request is submitted to /api/v1/tours/distance/:latlng/unit/:unit, invoke getDistances.  
router.route('/distances/:latlng/unit/:unit').get(tourController.getDistances);

// When the GET request is sent to /api/v1/tours, invoke getAllTours.  
// When the POST request is sent to /api/v1/tours, use protect and restrictTo as middleware, pass in 'admin' and 'lead-guide' as arguments in 
// the restrictTo function to restrict to only admins and lead-guides can add tours, invoke createTour.
router.route('/')
    .get(tourController.getAllTours)
    .post(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.createTour);

// When the GET request is sent to /api/v1/tours/:id, invoke getTour.   
// When the PATCH request is sent to /api/v1/tours/:id, use protect function and restrictTo function (with 'admin' and 'lead-guide' as argument)
// as middleware, because only admin and lead-guide type users can update tours, then invoke uploadTourImages and resizeTourImages, then invoke updateTour.  
// When the DELETE request is sent to /api/v1/tours/:id, use protect function and restrictTo function (with 'admin' and 'lead-guide' as argument)
// as middleware, because only admin and lead-guide type users can delete tours, then invoke deleteTour.  
router.route('/:id')
    .get(tourController.getTour)
    .patch(authController.protect, authController.restrictTo('admin', 'lead-guide'), 
        tourController.uploadTourImages, tourController.resizeTourImages, tourController.updateTour)
    .delete(authController.protect, authController.restrictTo('admin', 'lead-guide'), tourController.deleteTour);

// Export the router.  
module.exports = router;