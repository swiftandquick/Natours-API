// Require packages.  
const express = require('express');

// Require controller files.  
const bookingController = require('./../controllers/bookingController');
const authController = require('./../controllers/authController');

// Create a router for the reviews.  Set mergeParams to true so the router has access to the parameters of the parent route.  
const router = express.Router();

// Use protect middleware to ensure the requests to the routes below are only accessible by users.  
router.use(authController.protect);

// When the GET request is sent to /api/v1/checkout-session/:tourId, invoke protect as middleware, then invoke getCheckoutSession.  
router.get('/checkout-session/:tourId', authController.protect, bookingController.getCheckoutSession);

// Only admin and lead-guide can perform CRUD operations on the below routes.  
router.use(authController.restrictTo('admin', 'lead-guide'));

router
  .route('/')
  .get(bookingController.getAllBookings)
  .post(bookingController.createBooking);

router
  .route('/:id')
  .get(bookingController.getBooking)
  .patch(bookingController.updateBooking)
  .delete(bookingController.deleteBooking);

module.exports = router;