// Require packages.  
const mongoose = require('mongoose');
const slugify = require('slugify');

// Create a schema for tours. 
// Two objects created using tourSchema cannot share the same name.  
// ratingsAverage is default to 4.5 if not specified.  
// ratingsQuantity is default to 0 if not specified.  
// secretTour is default to false if not specified.  
// name has between 10 to 40 characters.  
// ratingsAverage must be between 1 to 5.  
// difficulty must be set to one of the following:  'easy', 'medium', 'difficult'.  
// Use a custom validator to ensure priceDiscount is less than price.  
// images is an array of String.  
// createdAt is a Date with default value being now.  
// startDates is an array of Date.  
// Trim the white spaces in the beginning and the end for the string inputs' value.  
// Properties with required set to true must have valid data inserted as the property's value. 
// When the data is output as JSON or object, set virtual to true so I can include virtual property.  
// Use GeoJSON to specify the startLocation, startLocation is a Point type an object.   
// Use GeoJSON to specify the locations objects, it's an array of Point type objects.  
// guides is an array of User, which is a type of mongoose object.  
const tourSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A tour must have a name.'],
        unique: true,
        trim: true, 
        maxlength: [40, 'A tour name cannot have more than 40 characters.'], 
        minlength: [10, 'A tour name cannot have less than 10 characters.']
    },
    slug: String, 
    duration: {
        type: Number,
        required: [true, 'A tour must have a duration.']
    },
    maxGroupSize: {
        type: Number,
        required: [true, 'A tour must have a group size.']
    },
    difficulty: {
        type: String, 
        required: [true, 'A tour must have a difficulty.'], 
        enum: {
            values: ['easy', 'medium', 'difficult'], 
            message: 'Difficulty is either easy, medium, or difficult.'
        }
    },
    ratingsAverage: {
        type: Number,
        default: 4.5, 
        min: [1, 'Rating must be equal to or above 1.0.'],
        max: [5, 'Rating must be equal to or below 5.0.'], 
        set: val => Math.round(val * 10) / 10
    },
    ratingsQuantity: {
        type: Number,
        default: 0
    },
    price: {
        type: Number,
        required: [true, 'A tour must have a price.']
    },
    priceDiscount: {
        type: Number,
        validate: {
            validator: function(val) {
                return val < this.price;
            },
            message: 'Discount price ({VALUE}) should be below the regular price.'
        }
    },
    summary: {
        type: String,
        require: [true, 'A tour must have a description.'],
        trim: true
    },
    description: {
      type: String,
      trim: true
    },
    imageCover: {
        type: String, 
        required: [true, 'A tour must have a cover image.']
    }, 
    images: [String],
    createdAt: {
        type: Date, 
        default: Date.now(), 
        select: false
    },
    startDates: [Date], 
    secretTour: {
        type: Boolean,
        default: false
    },
    startLocation: {
        type: {
            type: String,
            default: 'Point',
            enum: ['Point']
        },
        coordinates: [Number], 
        address: String,
        description: String
    },
    locations: [
        {
            type: {
                type: String,
                default: 'Point',
                enum: ['Point']
            },
            coordinates: [Number], 
            address: String,
            description: String, 
            day: Number
        }
    ],
    guides: [
        {
            type: mongoose.Schema.ObjectId, 
            ref: 'User'
        }
    ]
}, {
    toJSON: { virtuals: true }, 
    toObject: { virtuals: true }
});

// Storing the tours by price in ascending order and ratingsAverage by descending order.  
tourSchema.index({price: 1, ratingsAverage: -1});

// Storing the tours by slug in ascending order.  
tourSchema.index({slug: 1});

// We use 2dsphere index here, telling mongoDB startLocation to indexed at 2dsphere.  
tourSchema.index({startLocation: '2dsphere'});

// Calculate the durationWeeks (duration in weeks) virtual property base on duration (duration in days) by dividing duration by 7.  
tourSchema.virtual('durationWeeks').get(function() {
    return this.duration / 7;
});

// Use virtual populate the populate the reviews related to each tour.  
tourSchema.virtual('reviews', {
    ref: "Review",
    foreignField: 'tour',
    localField: '_id'
});

// A function will be call before the data is saved to the database, before save() or create() is invoked.  
// Give out the slugified name (slug) to the document before the document is saved, for example "Test Tour" will become "test-tour".  
tourSchema.pre('save', function(next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});

// Before the any query that starts with "find", such as findById(), findOne(), or find() is invoked, a function will be called.  
// Find the secret tour (document where secretTour is true) and hide it from being displayed in any routes.    
tourSchema.pre(/^find/, function(next) {
    this.find( { secretTour: {$ne: true}});
    this.start = Date.now();
    next();
});

// Before the any query that starts with "find", such as findById(), findOne(), or find() is invoked, a function will be called.  
// Populate the guides array, do not show the guide's __v and passwordChangedAt properties.  
tourSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'guides',
        select: '-__v -passwordChangedAt'
    }); 
    next();
});

// After the any query that starts with "find", such as findById(), findOne(), or find() is invoked, a function will be called.  
// Print out the the time it takes to execute the query after the find queries are executed.  
tourSchema.post(/^find/, function(docs, next) {
    // console.log(`Query took ${Date.now() - this.start} milliseconds.`);
    next();
});

// Before an aggregation, a function will be called.  
// Exclude the secret tour (document where secretTour is true) before any aggregation.  
/*
tourSchema.pre('aggregate', function(next) {
    this.pipeline().unshift( { $match: { secretTour: { $ne: true } } } );
    console.log(this.pipeline());
    next();
});
*/

// Create a Tour model using tourSchema schema.  
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;