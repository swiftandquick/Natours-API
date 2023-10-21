// Require packages.  
const jwt = require('jsonwebtoken');

// Require promisify from util module.  
const { promisify } = require('util');

// Require userModel from models folder.  
const User = require('./../models/userModel');

// Require function from catchAsync.js. 
const catchAsync = require('./../utils/catchAsync');

// Require the AppError class from appError.js.  
const AppError = require('./../utils/appError');

// Require the Email class from email.js.  
const Email = require('./../utils/email');

// Require the built-in crypto module.  
const crypto = require('crypto');

// Use jwt.sign() to return a jwt string, pass in the payload and secret as arguments.  
// The token expires after a period of time, which effectively logs the user out.  
const signToken = id => {
    return jwt.sign({ id }, process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRES_IN });
}

// Send the JWT (token).  
// Send JWT via cookie.  Cookie expires in 90 days.  
// In production mode, set secure to true.  
const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000), 
        httpOnly: true
    };
    if(process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
    }
    res.cookie('jwt', token, cookieOptions);
    res.status(statusCode).json({
        status: 'success',
        token
    });
} 

// Wrap the catchAsync function around the async function to catch the error without having the try-catch block.   
// Send a welcome email to the newly created user.  
// Create a user based on req.body.  
exports.signup = catchAsync(async(req, res, next) => {
    const newUser = await User.create({
       name: req.body.name,
       email: req.body.email,
       password: req.body.password,
       passwordConfirm: req.body.passwordConfirm, 
       passwordChangedAt: req.body.passwordChangedAt,
       role: req.body.role
    });
    const url = `${req.protocol}://${req.get('host')}/me`;
    await new Email(newUser, url).sendWelcome();
    createSendToken(newUser, 201, res);
});

// Wrap the catchAsync function around the async function to catch the error without having the try-catch block.  
// Check if email and password exist.  
// Check if user exists and password is correct.  
// If everything is OK, send token to client.  
exports.login = catchAsync(async(req, res, next) => {
    const { email, password } = req.body;
    if(!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }
    const user = await User.findOne( { email }).select(('+password'));
    if(!user || !await user.correctPassword(password, user.password)) {
        return next(new AppError('Incorrect email or password', 401));
    }
    createSendToken(user, 200, res);
});

// Token expires in 10 seconds.  
exports.logout = (req, res) => {
    res.cookie('jwt', 'loggedout', {
        expires: new Date(Date.now() + 10 * 1000),
        httpOnly: true
    });
    res.status(200).json({ status: 'success' });
};


// Wrap the catchAsync function around the async function to catch the error without having the try-catch block.  
// Get the token and check if it's there, the token has the key of "Authorization" and value starts with "Bearer" as the first word.  
// If the token exists, the token is the second word for the Authorization value. 
// If the token doesn't exist but cookies.jwt (jwt property of cookies object) does, set token equals jwt.   
// If the neither token or cookies.jwt exists token doesn't exist, render an error.    
// Verify the token with jwt.verify().  
// Check if user exists.  If the user no longer exists, render an error.  
// Check if user changed password after the token is issued.  
// If password is changed, which means decoded's iat value is less than passwordChangedAt's integer value, render an error.  
// Set req.user to currentUser to grant access to protected route.  
exports.protect = catchAsync(async(req, res, next) => {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } 
    else if (req.cookies.jwt) {
        token = req.cookies.jwt;
    }
    if (!token) {
        return next(new AppError('You are not logged in! Please log in to get access.', 401));
    }
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
        return next(
        new AppError(
            'The user belonging to this token does no longer exist.',
            401
        )
        );
    }
    if (currentUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password! Please log in again.', 401));
    }
    req.user = currentUser;
    res.locals.user = currentUser;
    next();
});

// Only for render pages, no errors.  First, verify token.  
// Check if the user still exists, call the next middleware.  
// Check if the user changed password after token was issued, call the next middleware.  
// If there is a logged user, call the next middleware.  
exports.isLoggedIn = catchAsync(async(req, res, next) => {
    if (req.cookies.jwt) {
        try {
            const decoded = await promisify(jwt.verify)(
                req.cookies.jwt,
                process.env.JWT_SECRET
            );
            const currentUser = await User.findById(decoded.id);
            if (!currentUser) {
                return next();
            }
            if (currentUser.changedPasswordAfter(decoded.iat)) {
                return next();
            }
            res.locals.user = currentUser;
            return next();
        } 
        catch (err) {
            return next();
        }
    }
    next();
});

// Use rest parameter to create an array of arguments, the arguments is stored in the roles array.  
// If roles array doesn't include the user's role, in case of deleting tours, if user is neither admin or lead-guide, render an error.  
// Otherwise, call the next middleware and allow the user to perform a certain action, such as deleting a tour.  
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if(!roles.includes(req.user.role)) {
            return next(new AppError('You do have permission to perform this action.', 403));
        }
        next();
    }
}

// Wrap the catchAsync function around the async function to catch the error without having the try-catch block.  
// Get user based on posted email.  If there's no user with that email address, render an error.  
// Generate the random reset token, save the reset token into the database for the user.  
// Send the token to user's email by creating a new Email object, then invoke sendPasswordReset method.  Send the resetURL which includes resetToken.  
// If there's an error sending out an email, an email will be rendered, passwordResetToken and passwordResetExpires will set to undefined.  
exports.forgotPassword = catchAsync(async(req, res, next) => {
    const user = await User.findOne({ email: req.body.email });
    if(!user) {
        return next(new AppError('There is no user with that email address.', 404));
    }
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    try {
        const resetURL = `${req.protocol}://${req.get('host')}/api/v1/users/resetPassword/${resetToken}`;
        await new Email(user, resetURL).sendPasswordReset();
        res.status(200).json({
            status: 'success',
            message: 'Token is sent to your email!'
        });
    }
    catch(err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        await user.save({ validateBeforeSave: false });
        return next(new AppError('There was an error sending the email.  Try again later!', 500));
    }
});

// Wrap the catchAsync function around the async function to catch the error without having the try-catch block.  
// Get the user based on the token.  First, hash the token, then find the user based on the hashedToken, which only lasts 10 minutes.  
// If token exists and passwordResetExpires is also greater than now, which means the token is yet expired, retrieve that user.  
// If token expires or cannot be found, a user won't be returned, if that's the case, render an error.  
// If the token has not expired, and there is user, set the new password.  After resetting the password, the reset token is gone.  
// Save the user, which updates the user's password and passwordConfirm.  
// Log the user in, send JWT.  
exports.resetPassword = catchAsync(async(req, res, next) => {
    const hashedToken = crypto.createHash('sha256').update(req.params.token).digest('hex');
    const user = await User.findOne({ passwordResetToken: hashedToken, passwordResetExpires: { $gt:Date.now() } });
    if(!user) {
        return next(new AppError('Token is invalid or has expired.', 400));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    createSendToken(user, 200, res);
});

// Wrap the catchAsync function around the async function to catch the error without having the try-catch block.  
// Get user from collection.  
// Check if the posted current password is correct.  If current password is not correct, render error.  
// If the password is correct, update the password.  
// Log the user in, send JWT.  
exports.updatePassword = catchAsync(async(req, res, next) => {
    const user = await User.findById(req.user.id).select('+password');
    if(!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
        return next(new AppError("Your current password is wrong.", 401));
    }
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    await user.save();
    createSendToken(user, 200, res);
});