// Require packages.  
const express = require('express');

// Create a router for the users.  
const router = express.Router();

// Import functions from controller files.  
const viewController = require('../controllers/viewController');
const authController = require('../controllers/authController');
const bookingController = require('../controllers/bookingController');

// When a GET request is sent to localhost:3000, invoke createBookingCheckout and isLoggedIn middleware, then invoke getOverview.  
router.get('/', bookingController.createBookingCheckout, authController.isLoggedIn, viewController.getOverview);

// When a GET request is sent to localhost:3000/tour/:slug, invoke isLoggedIn middleware, then invoke getTour.  
router.get('/tour/:slug', authController.isLoggedIn, viewController.getTour);

// When a GET request is sent to localhost:3000/login, invoke isLoggedIn middleware, then invoke getLoginForm.  
router.get('/login', authController.isLoggedIn, viewController.getLoginForm);

// When a GET request is sent to localhost:3000/me, invoke the protect middleware, then invoke getAccount.  
router.get('/me', authController.protect, viewController.getAccount);

// When a POST request is submitted to /submit-user-data, invoke the protect middleware, then invoke updateUserData.  
router.post('/submit-user-data', authController.protect, viewController.updateUserData);

// When a GET request is submitted to /submit-user-data, invoke the protect middleware, then invoke getMyTours.  
router.get('/my-tours', authController.protect, viewController.getMyTours);

module.exports = router;