// Import AppError class from appError.js.  
const AppError = require('./../utils/appError');

// This is for handling cast errors.  
// Use AppError class to get a 400 error code along with a new error message.  
const handleCastErrorDB = err => {
    const message = `Invalid ${err.path}: ${err.value}.`;
    return new AppError(message, 400);
};

// This is for handling duplicated fields.  
// Use AppError class to get a 400 error code along with a new error message.  
const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    const message = `Duplicate field value:  ${value}.  Please use another value!`;
    return new AppError(message, 400);
}

// This is for handling validation errors.  
// Use AppError class to get a 400 error code along with a new error message.  
const handleValidationErrorDB = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Input input data.  ${errors.join('  ')}`;
    return new AppError(message, 400);
}

// This is for handling JWT errors.  
// Use AppError class to get a 401 error code along with a new error message.  
const handleJWTError = () => new AppError("Invalid token.  Please log in again.", 401);

// This is for handling JWT (tokens) expiration errors.  
// Use AppError class to get a 401 error code along with a new error message.  
const handleJWTExpiredError = () => new AppError("Your token has expired!  Please log in again.", 401);

// Display stack and error during developent mode.  
// If the URL starts with /api, display the error in JSON format, otherwise, render error.pug.  
const sendErrorDev = (err, req, res) => {
    if(req.originalUrl.startsWith('/api')) {        
        res.status(err.statusCode).json({
            status: err.status, 
            error: err,
            message: err.message,
            stack: err.stack
        });
    }
    res.status(err.statusCode).render('error', {
        title: 'Something went wrong.',
        msg: err.message
    });
}

// Don't display stack and error during production mode. 
// Only display the error if it's an operational error, where isOperational is true.  
// Don't show programming errors to the client.  
// If the URL starts with /api, display the error in JSON format, otherwise, render error.pug.  
const sendErrorProd = (err, req, res) => {
    if(req.originalUrl.startsWith('/api')) {    
        if(err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status, 
                message: err.message
            });
        }
        else {
            console.error(err);
            res.status(500).json({
                status: 'error', 
                message: 'Something went wrong.'
            });
        }    
    }
    else {
        if(err.isOperational) {
            res.status(err.statusCode).render('error', {
                title: 'Something went wrong.',
                msg: err.message
            });
        }
        else {
            console.error(err);
            res.status(err.statusCode).render('error', {
                title: 'Something went wrong.',
                msg: 'Please try again later.'
            });
        }    
    }
}

// This is a middleware used to catch errors.  
// If there is a statusCode for err, set it to statusCode, otherwise, the default is 500. 
// If we are in development mode, render sendErrorDev.  
// If we are in production mode, make err into an object via Object.assign(), then save it in the error variable.  
// If the name of the error is CastError, set error equals to the returned value of handleCastErrorDB.  
// If the code of the error is 11000, set error equals to the returned value of handleDuplicateFieldsDB.  
// If the name of the error is VadliationError, set error equals to the returned value of handleValidationErrorDB.  
// If the name of the error is JsonWebTokenError, set error equals to the returned value of handleJWTError.  
// If the name of the error is TokenExpiredError, set error equals to the returned value of handleJWTExpiredError.  
// Render the error using the sendErrorProd function.  
module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';
    if(process.env.NODE_ENV === 'development') {
        sendErrorDev(err, req, res);
    }
    else if(process.env.NODE_ENV === 'production') {
        let error = Object.assign(err);
        if(error.name === 'CastError') {
            error = handleCastErrorDB(error);
        }
        if(error.code === 11000) {
            error = handleDuplicateFieldsDB(error);
        }
        if(error.name === 'ValidationError') {
            error = handleValidationErrorDB(error);
        }
        if(error.name === 'JsonWebTokenError') {
            error = handleJWTError();
        }
        if (error.name === 'TokenExpiredError') {
            error = handleJWTExpiredError();
        }
        sendErrorProd(error, req, res);
    }
}