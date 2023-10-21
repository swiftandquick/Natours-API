const mongoose = require('mongoose');

// Create a schema for bookings. 
// Booking belongs to a tour and a user.  
// Set the createdAt to now.  
const bookingSchema = new mongoose.Schema({
    tour: {
        type: mongoose.Schema.ObjectId,
        reference: 'Tour',
        required: [true, 'Booking must belong to a Tour!']
    },
    user: {
        type: mongoose.Schema.ObjectId,
        ref: 'User', 
        required: [true, 'Booking must belong to a User!']
    },
    price: {
        type: Number, 
        require: [true, 'Booking must have a price.']
    },
    createdAt: {
        type: Date,
        default: Date.now()
    },
    paid: {
        type: Boolean,
        default: true
    }
});

// Before any queries start with find such as findOneById() is invoked.  
// Populate user and tour.  
bookingSchema.pre(/^find/, function(next) {
    this.populate('user').populate({
        path: 'tour',
        select: 'name'
    });
    next();
});

// Create a Booking Model based on bookingSchema.  
const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;