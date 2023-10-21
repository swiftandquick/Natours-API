// Require packages.  
const mongoose = require('mongoose');

// Require the Tour model.  
const Tour = require('./tourModel');

// Create a schema for reviews. 
// ratings is a number between 1 to 5.  
// createdAt's default value is now.  
// Reference to parents:  tour and user, reference is mandatory.   
const reviewSchema = new mongoose.Schema(
    {
        review: {
            type: String, 
            required: [true, 'Review cannot be empty!']
        },
        rating: {
            type: Number,
            min: 1,
            max: 5
        }, 
        createdAt: {
            type: Date,
            default: Date.now
        },
        tour: {
            type: mongoose.Schema.ObjectId, 
            ref: 'Tour',
            required: [true, 'Review must belong to a tour.']
        },
        user: {
            type: mongoose.Schema.ObjectId, 
            ref: 'User',
            required: [true, 'Review must belong to a user.']
        }
    }, 
    {
        toJSON: { virtuals: true }, 
        toObject: { virtuals: true }
    }
);

// Each combination of tour and user has to be unique, which means a user can't post two reviews n the same tour.  
reviewSchema.index({tour: 1, user: 1}, { unique: true });

// Before the any query that starts with "find", such as findById(), findOne(), or find() is invoked, a function will be called.  
// Populate the user (get the name and photo).  
reviewSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'user', 
        select: 'name photo'
    })
    next();
});

// Takes in the tourId as argument.  Use aggregation pipeline to calculate the average rating.  
// First, select the tour with the specified tourId.  
// Group the review documents by the tour ID, for each review document related to the tour, add 1 to nRatings.  
// avgRating is the average of all related review documents' rating property.  
// If stats.length is greater than 0, which means there are reviews, find the tour by ID and update it with the correct ratingsQuantity 
// and ratingsAverage values.  If stats.length is 0, which means all reviews are deleted, set ratingsQuantity and ratingsAverage back to default values.  
reviewSchema.statics.calcAverageRatings = async function(tourId) {
    const stats = await this.aggregate([
        {
            $match: { tour: tourId }
        },
        {
            $group: {
                _id: '$tour', 
                nRatings: { $sum: 1 }, 
                avgRating: { $avg: '$rating' }
            }
        }
    ]);
    if(stats.length > 0) {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: stats[0].nRatings,
            ratingsAverage: stats[0].avgRating
        });
    }
    else {
        await Tour.findByIdAndUpdate(tourId, {
            ratingsQuantity: 0,
            ratingsAverage: 4.5
        });
    }
}

// After any save() or create() is invoked, a function will be called.  
// Invoke calcAverageRatings, pass in the tour that's related to the current review as argument.  
reviewSchema.post('save', function() {
    this.constructor.calcAverageRatings(this.tour);
});

// Before any queries start with findOneAnd such as findOneAndUpdate() or findOneAndDelete() is invoked.  
// Create an r variable to save the current review.  
reviewSchema.pre(/^findOneAnd/, async function(next) {
    this.r = await this.clone().findOne();
    next();
});

// After any queries start with findOneAnd such as findOneAndUpdate() or findOneAndDelete() is invoked.  
// Invoke calcAverageRatings on current review's (this.r) tour property.  
reviewSchema.post(/^findOneAnd/, async function(next) {
    await this.r.constructor.calcAverageRatings(this.r.tour);
});

// Create a Review Model based on reviewSchema.  
const Review = mongoose.model('Review', reviewSchema);

module.exports = Review;