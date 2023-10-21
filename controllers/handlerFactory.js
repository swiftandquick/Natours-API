// Require function from catchAsync.js. 
const catchAsync = require('./../utils/catchAsync');

// Require AppError class from AppError.js.  
const AppError = require('./../utils/appError');

// Require APIFeatures class from apiFeatures.js.  
const APIFeatures = require('./../utils/apiFeatures');

// Wrap the catchAsync function around the async function to catch the error without having the try-catch block.  
// Set filter to {}, so if there's no tourId in the parameter, then filter will not change and all documents (reviews) are returned.  
// If there is tourId in the parameter, set filter to req.params.tourId, so only the documents (reviews) related to the tour are returned.   
// Render all documents I have in the MongoDB Atlas database.  
// Create an instance of APIFeatures class, which contains API features, find() is the query, req.query is queryString.  
// Chain the methods from APIFeatures class.  
exports.getAll = Model => catchAsync(async(req, res) => {
    let filter = {};
    if(req.params.tourId) {
        filter = { tour: req.params.tourId };
    }
    const features = new APIFeatures(Model.find(filter), req.query).filter().sort().limitFields().paginate();
    // const doc = await features.query.explain();
    const doc = await features.query;
    res.status(200).json({
        status: 'success', 
        requestedAt: req.requestTime,
        results: doc.length,
        data: {
            data: doc
        }
    });
});

// Wrap the catchAsync function around the async function to catch the error without having the try-catch block.  
// Takes in req.body and use a Model to create an object, save it into the doc variable.  
exports.createOne = Model => catchAsync(async(req, res) => {
    const doc = await Model.create(req.body);
    res.status(201).json({
        status: 'success',
        data: {
            data: doc
        }
    });
});

// Find the ID by its parameter, if the ID exists, display the tour, otherwise display error, populate popOptions if popOptions exist.  
// If there's no doc, render a new error with AppError.  
exports.getOne = (Model, popOptions) => catchAsync(async(req, res, next) => {
    let query = Model.findById(req.params.id);
    if(popOptions) {
        query = query.populate(popOptions);
    }
    const doc = await query;
    if (!doc) {
        return next(new AppError('No document found with that ID.', 404));
    }
    res.status(200).json({
        status: 'success', 
        data: {
            data: doc
        }
    });
});

// Wrap the catchAsync function around the async function to catch the error without having the try-catch block.   
// Find the ID by its parameter, if the ID exists, update the document with new data from req.body.  
// If there's no document, render a new error with AppError.  
exports.updateOne = Model => catchAsync(async(req, res, next) => {
    const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true
    });
    if (!doc) {
        return next(new AppError('No document found with that ID.', 404));
    }
    res.status(200).json({
        status: 'success', 
        data: {
            data: doc
        }
    });
});

// Wrap the catchAsync function around the async function to catch the error without having the try-catch block.   
// Find the ID by its parameter, if the ID exists, delete the document.  
// If there's no document, render a new error with AppError.  
exports.deleteOne = Model => catchAsync(async (req, res, next) => {
    const doc = await Model.findByIdAndDelete(req.params.id);
    if (!doc) {
        return next(new AppError('No document found with that ID.', 404));
    }
    res.status(204).json({
        status: 'success',
        data: null
    });
});