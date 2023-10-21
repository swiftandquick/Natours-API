// Require models.  
const Tour = require('../models/tourModel');
const User = require('../models/userModel');
const Booking = require('../models/bookingModel');

// Require function from catchAsync.js. 
const catchAsync = require('./../utils/catchAsync');

// Require AppError class from AppError.js.  
const AppError = require('./../utils/appError');

// Wrap the catchAsync function around the async function to catch the error without having the try-catch block.   
// Get tour data from collection.  Build template.  
// Render overview.pug.  Pass in title to be used in the pug file.  Render that template using tour data.  
exports.getOverview = catchAsync(async(req, res, next) => {
    const tours = await Tour.find();
    res.status(200).render('overview', {
        title: 'All Tours',
        tours
    });
});

// Wrap the catchAsync function around the async function to catch the error without having the try-catch block.   
// Search for slug, get the data for the requested tour (including reviews and guides).  Build template.  
// If there is no tour, render an error.  
// Render tour.pug.  Pass in title to be used in the pug file, render the tour data.  
// Set the Content-Security-Policy to a certain string to allow Mapbox to display a map on the tour.pug page.  
exports.getTour = catchAsync(async(req, res, next) => {
    const tour = await Tour.findOne({slug: req.params.slug}).populate({
        path: 'reviews',
        fields: 'review rating user'
    });
    if(!tour) {
        return next(new AppError('There is no tour with that name.'), 404);
    }
    res.status(200)
        .set(
            'Content-Security-Policy',
            'connect-src https://*.tiles.mapbox.com https://api.mapbox.com https://events.mapbox.com'
        )
        .render('tour', {
        title: `${tour.name} Tour`,
        tour
    });
});
 
// Render login.pug.  Pass in title to be used in the pug file.  
// Set the Content-Security-Policy to a certain string to allow axios to be used.  
exports.getLoginForm = (req, res) => {
    res.status(200)    
        .set(
            'Content-Security-Policy',
            "connect-src 'self' https://cdnjs.cloudflare.com"
        )
        .render('login', {
            title: 'Login'
        });
};

// Render account.pug.  
exports.getAccount = (req, res) => {
    res.status(200).render('account', {
        title: 'Your account'
    });
}

// Wrap the catchAsync function around the async function to catch the error without having the try-catch block.   
// Find all bookings, find tours with the returned ID.  Render overview.pug.  
exports.getMyTours = catchAsync(async(req, res, next) => {
    const bookings = await Booking.find({ user: req.user.id });
    const tourIDs = bookings.map(el => el.tour);
    const tours = await Tour.find({ _id: { $in: tourIDs } });
    res.status(200).render('overview', {
        title: 'My Tours',
        tours
    });
});

// Wrap the catchAsync function around the async function to catch the error without having the try-catch block.   
// Update the user based on req.body, run validator.  
exports.updateUserData = catchAsync(async (req, res, next) => {
    const updatedUser = await User.findByIdAndUpdate(
        req.user.id,
        {
            name: req.body.name,
            email: req.body.email
        },
        {
            new: true,
            runValidators: true
        }
    );
    res.status(200)
        .render('account', {
            title: 'Your account',
            user: updatedUser
        });
});