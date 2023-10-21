// Require packages.  
const multer = require('multer');
const sharp = require('sharp');

// Import Tour from tourModel.js.  
const Tour = require('./../models/tourModel');

// Require function from catchAsync.js. 
const catchAsync = require('./../utils/catchAsync');

// Require AppError class from AppError.js.  
const AppError = require('./../utils/appError');

// Require functions from handlerFactory.js.  
const factory = require('./handlerFactory');

// Store the file in a buffer.  
const multerStorage = multer.memoryStorage();

// Filter out files that are not images.   
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image! Please upload only images.', 400), false);
    }
};

// Set the storage and fileFilter.  
const upload = multer({ 
    storage: multerStorage,
    fileFilter: multerFilter
});

// First image is the stored as imageCover.  Next 3 images are placed in the images array.  
exports.uploadTourImages = upload.fields([
    {
        name: 'imageCover', 
        maxCount: 1
    },
    {
        name: 'images', 
        maxCount: 3
    }
]);

// If req.files don't have imageCover or images, go the next function.  
// For imageCover image, resize it to 3:2 ratio, save as jpeg, save it in public/img/tours.  
// Use map() to save all images, resize it to 3:2 ratio, save as jpeg, save it in public/img/tours.  
exports.resizeTourImages = catchAsync(async(req, res, next) => {
    console.log(req.files);
    if(!req.files.imageCover || !req.files.images) {
        return next();
    }
    else {
        req.body.imageCover = `tour-${req.params.id}-${Date.now()}-cover.jpeg`;
        await sharp(req.files.imageCover[0].buffer)
            .resize(2000, 1333)
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(`public/img/tours/${req.body.imageCover}`);
        req.body.images = [];
        await Promise.all(req.files.images.map(async(file, i) => {
            const filename = `tour-${req.params.id}-${Date.now()}-${i + 1}.jpeg`;
            await sharp(file.buffer)
                .resize(2000, 1333)
                .toFormat('jpeg')
                .jpeg({ quality: 90 })
                .toFile(`public/img/tours/${filename}`);
            req.body.images.push(filename);
        }));
        next();
    }
});

// Use a middleware function to display 5 tours on a page. 
// Sort from highest ratingsAverage to lowest ratingsAverage, then sort from lowest price to highest price.  
// Only display name, price, ratingsAverage, summary, and difficulty.   
exports.aliasTopTours = (req, res, next) => {
    req.query.limit = '5';
    req.query.sort = '-ratingsAverage,price';
    req.query.fields = 'name,price,ratingsaverage,summary,difficulty';
    next();
}

// Invoke getOne, pass in Tour as argument.  
exports.getAllTours = factory.getAll(Tour);

// Invoke createOne, pass in Tour as argument.  
exports.createTour = factory.createOne(Tour);

// Invoke getOne, pass in Tour and { path: 'reviews' } as arguments.  
exports.getTour = factory.getOne(Tour, { path: 'reviews'});

// Invoke updateOne, pass in Tour as argument.  
exports.updateTour = factory.updateOne(Tour);

// Invoke deleteOne, pass in Tour as argument.  
exports.deleteTour = factory.deleteOne(Tour);

// Wrap the catchAsync function around the async function to catch the error without having the try-catch block.   
// Use an aggregation pipeline to manipulate the data.  
// Calculate the number of documents, total number of ratingsQuantity, 
// average ratingsAverage, average price, minimum price, maximum price of all documents with greater than 4.5 ratingsAverage.  
// Seperate the groups by difficulty's value.  So we will get the likes of average price for each difficulty level. 
// Sort by avgPrice, from lowest to highest.  
exports.getTourStats = catchAsync(async(req, res) => {
    const stats = await Tour.aggregate([
        {
            $match: { ratingsAverage: { $gte: 4.5 } }
        },
        {
            $group: {
                _id: { $toUpper: '$difficulty' },
                num: { $sum: 1 },
                numRatings: { $sum: '$ratingsQuantity' },
                avgRating: { $avg: '$ratingsAverage' },
                avgPrice: { $avg: '$price' }, 
                minPrice: { $min: '$price' }, 
                maxPrice: { $max: '$price' }, 
            }
        },
        {
            $sort: { avgPrice: 1 }
        }
    ]);
    res.status(200).json({
        status: 'success', 
        data: {
            stats
        }
    });
});

// Wrap the catchAsync function around the async function to catch the error without having the try-catch block.  
// Get the year from the parameter, make it into a number.  
// Unwind documents by startDates, the document with an array of 3 startDates elements will unwind into 3 documents with each having 
// a different startDates value.  Use $match to get only results from the year.  Then, group the documents by startDates' month, 
// count the amount of tours for each month on that year, and list all the tour names of that month in an array.  
// Add the field month, which is the same as _consoleid.  Hide the _id property using $project keyword.  
// Sort the objects in the plan array from highest numToursStarts value to lowest numTourStarts value.  
// Only display up to 12 objects in the plan array.  
exports.getMonthlyPlan = catchAsync(async(req, res) => {
    const year = req.params.year * 1;
    const plan = await Tour.aggregate([
        {
            $unwind: '$startDates'
        },
        {
            $match: {
                startDates: {
                    $gte: new Date(`${year}-01-01`), 
                    $lte: new Date(`${year}-12-31`)
                }
            }
        }, 
        {
            $group: {
                _id: { $month: '$startDates' }, 
                numTourStarts: { $sum: 1 },
                tours: { $push: '$name' }
            }
        },
        {
            $addFields: { month: '$_id' }
        },
        {
            $project: { _id: 0 }
        },
        {
            $sort: { numTourStarts: -1 }
        },
        {
            $limit: 12
        }
    ]);
    res.status(200).json({
        status: 'success', 
        data: {
            plan
        }
    });
});

// Wrap the catchAsync function around the async function to catch the error without having the try-catch block.  
// Use destructuring to get distance, latlng, and unit from the parameters.  
// Because latlng is a string with a comma splitting the lat and lng, use split() method to retrieve individual lat and lng values.  
// If there's no lat or lng, render an error.  Get the radius value, if unit is mi, distance is divide distance by 3963.2, that's the radius of the Earth
// in miles, if distance is not mi, it's default to km, then radius is distance divide by 6378.1, that's the radius of the Earth in kilometers.  
// Use geospatial query to find the tours that are within the distance.  
exports.getToursWithin = catchAsync(async(req, res, next) => {
    const { distance, latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
    const radius = unit === 'mi' ? distance / 3963.2 : distance / 6378.1;
    if(!lat || !lng) {
        next(new AppError('Please provide latitude and longtitude in the format of "lat,lng".'), 400);
    }
    const tours = await Tour.find(
        { startLocation: { $geoWithin: { $centerSphere: [[lng, lat], radius]} } });
    res.status(200).json({
        status: 'success',
        results: tours.length,
        data: {
            data: tours
        }
    });
});

// Wrap the catchAsync function around the async function to catch the error without having the try-catch block.  
// Use destructuring to get distance, center, and unit from the parameters.  
// Because latlng is a string with a comma splitting the lat and lng, use split() method to retrieve individual lat and lng values.  
// If there's no lat or lng, render an error.  Get the multiplier, if unit is "mi", set multiplier to 0.000621371, if unit is not specified, treat 
// the unit as km, which means multiplier is 0.001.  Use aggregation pipeline to calculate the distance.  
// Use geospatial aggregation, $geoNear is always the first query, set near equals a Point type object with lng and lat as coordinates.   
// The returned distance is in meters, use distanceMultiplier to convert the unit to km or mi.  Only keep the distance and name for each tour.  
exports.getDistances = catchAsync(async(req, res, next) => {
    const { latlng, unit } = req.params;
    const [lat, lng] = latlng.split(',');
    const multiplier = unit === "mi" ? 0.000621371 : 0.001;
    if(!lat || !lng) {
        next(new AppError('Please provide latitude and longtitude in the format of "lat,lng".'), 400);
    }
    const distances = await Tour.aggregate([
        {
            $geoNear: {
                near: {
                    type: 'Point',
                    coordinates: [lng * 1, lat * 1]
                },
                distanceField: 'distance', 
                distanceMultiplier: multiplier
            }
        },
        {
            $project: {
                distance: 1,
                name: 1
            }
        }
    ]);
    res.status(200).json({
        status: 'success',
        data: {
            data: distances
        }
    });
});