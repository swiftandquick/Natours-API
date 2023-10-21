// Require packages.  
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Import models.  
const Tour = require('./../models/tourModel');
const Booking = require('./../models/bookingModel');

// Require function from catchAsync.js. 
const catchAsync = require('./../utils/catchAsync');

// Require AppError class from AppError.js.  
const AppError = require('./../utils/appError');

// Require functions from handlerFactory.js.  
const factory = require('./handlerFactory');

// Wrap the catchAsync function around the async function to catch the error without having the try-catch block.  
// Get the currently booked tour.  
// Create checkout session.  
// Create session as response.  
exports.getCheckoutSession = catchAsync(async(req, res, next) => {
    const tour = await Tour.findById(req.params.tourId);
    const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        success_url: `${req.protocol}://${req.get('host')}/?tour=${req.params.tourId}&user=${req.user.id}&price=${tour.price}`,
        cancel_url: `${req.protocol}://${req.get('host')}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id: req.params.tourId,
        line_items: [
            {
                quantity: 1,
                price_data: {
                    currency: 'usd',
                    unit_amount: tour.price * 100,
                    product_data: {
                        name: `${tour.name} Tour`,
                        description: tour.summary,
                        images: [`https://www.natours.dev/img/tours/${tour.imageCover}`],
                    },
                },
            },
        ],
        mode: 'payment',
    });
    res.status(200).json({
        status: 'success',
        session
    })
});

// Wrap the catchAsync function around the async function to catch the error without having the try-catch block.  
// If there's no tour, no user, or no price, go to the next middleware.  
// Otherwise, create a Booking object.  
exports.createBookingCheckout = catchAsync(async(req, res, next) => {
    const { tour, user, price } = req.query;
    if(!tour || !user || !price) {
        return next();
    }
    else {
        await Booking.create({ tour, user, price });
        res.redirect(req.originalUrl.split('?')[0]);
    }
});

// Factory functions for CRUD operations on Booking.  
exports.createBooking = factory.createOne(Booking);
exports.getBooking = factory.getOne(Booking);
exports.getAllBookings = factory.getAll(Booking);
exports.updateBooking = factory.updateOne(Booking);
exports.deleteBooking = factory.deleteOne(Booking);