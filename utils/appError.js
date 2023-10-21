// AppError is a subclass of Error class, which inherits all Error's property.  
// If statusCode starts with 4, status is fail, otherwise, it's error.  
class AppError extends Error {
    constructor(message, statusCode) {
        super(message);
        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = true;
        Error.captureStackTrace(this, this.constructor);
    }
}

module.exports = AppError;