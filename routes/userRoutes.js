// Require packages.  
const express = require('express');

// Import the controllers functions from tourController.js.  
const userController = require('./../controllers/userController');

// Import the controllers functions from authController.js.  
const authController = require('./../controllers/authController');

// Create a router for the users.  
const router = express.Router();

// When the POST request is sent to /api/v1/users/signup, invoke signup.  
router.post('/signup', authController.signup);

// When the POST request is sent to /api/v1/users/login, invoke login.  
router.post('/login', authController.login);

// When the GET request is sent to /api/v1/users/logout, invoke logout.  
router.get('/logout', authController.logout);

// When the POST request is sent to /api/v1/users/forgotPassword, invoke forgotPassword.  
router.post('/forgotPassword', authController.forgotPassword);

// When the PATCH request is sent to /api/v1/users/resetPassword/:token, invoke resetPassword.  
router.patch('/resetPassword/:token', authController.resetPassword);

// Use protect as a middleware to protect all the routes after the below line of code.  
router.use(authController.protect);

// When the PATCH request is sent to /api/v1/users/updateMyPassword, then invoke updatePassword.  
router.patch('/updateMyPassword', authController.updatePassword);

// When the GET request is sent to /api/v1/users/me, use getMe as middleware, then invoke getUser.
router.get('/me', userController.getMe, userController.getUser);

// When the PATCH request is sent to /api/v1/users/updateMe, invoke the uploadUserPhoto and resizeUserPhoto middleware, then invoke updateMe.  
router.patch('/updateMe', userController.uploadUserPhoto, userController.resizeUserPhoto, userController.updateMe);

// When the DELETE request is sent to /api/v1/users/deleteMe, then invoke deleteMe.  
router.delete('/deleteMe', userController.deleteMe);

// Use restrictTo as a middleware to restrict the actions of manipulating the user database to admins only for routes below this line of code.  
router.use(authController.restrictTo('admin'));

// When the GET request is sent to /api/v1/users, invoke getAllUsers.  
// When the POST request is sent to /api/v1/users, invoke createUser.  
router.route('/')
    .get(userController.getAllUsers)
    .post(userController.createUser);

// When the GET request is sent to /api/v1/users/:id, invoke getUser.  
// When the PATCH request is sent to /api/v1/users/:id, invoke updateUser.  
// When the DELETE request is sent to /api/v1/users/:id, invoke deleteUser.   
router.route('/:id')
    .get(userController.getUser)
    .patch(userController.updateUser)
    .delete(userController.deleteUser);

// Export the router.  
module.exports = router;