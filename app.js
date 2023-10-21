// Require path module from nodeJS.  
const path = require('path');

// Require packages.  
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const cookieParser = require('cookie-parser');
const csp = require('express-csp');
const compression = require('compression');

// Require the AppError class from AppError.js.  
const AppError = require('./utils/appError');

// Require the function from errorControl.js.  
const globalErrorHandler = require('./controllers/errorController');

// Require the routers from the routes folder.  
const tourRouter = require('./routes/tourRoutes');
const userRouter = require('./routes/userRoutes');
const reviewRouter = require('./routes/reviewRoutes');
const bookingRouter = require('./routes/bookingRoutes');
const viewRouter = require('./routes/viewRoutes');

// I can use many express functions on the app object.  
const app = express();

// Set view engine to pug.  
app.set('view engine', 'pug');

// Set views to the views directory.  
app.set('views', path.join(__dirname, 'views'));

// Use helmet as middleware.  This set security HTTP headers.  
// Set security HTTP headers
app.use(helmet());
csp.extend(app, {
    policy: {
        directives: {
            'default-src': ['self'],
            'style-src': ['self', 'unsafe-inline', 'https:'],
            'font-src': ['self', 'https://fonts.gstatic.com'],
            'script-src': [
                'self',
                'unsafe-inline',
                'data',
                'blob',
                'https://js.stripe.com',
                'https://*.mapbox.com',
                'https://*.cloudflare.com/',
                'https://bundle.js:8828',
                'ws://localhost:56558/',
            ],
            'worker-src': [
                'self',
                'unsafe-inline',
                'data:',
                'blob:',
                'https://*.stripe.com',
                'https://*.mapbox.com',
                'https://*.cloudflare.com/',
                'https://bundle.js:*',
                'ws://localhost:*/',
            ],
            'frame-src': [
                'self',
                'unsafe-inline',
                'data:',
                'blob:',
                'https://*.stripe.com',
                'https://*.mapbox.com',
                'https://*.cloudflare.com/',
                'https://bundle.js:*',
                'ws://localhost:*/',
            ],
            'img-src': [
                'self',
                'unsafe-inline',
                'data:',
                'blob:',
                'https://*.stripe.com',
                'https://*.mapbox.com',
                'https://*.cloudflare.com/',
                'https://bundle.js:*',
                'ws://localhost:*/',
            ],
            'connect-src': [
                'self',
                'unsafe-inline',
                'data:',
                'blob:',
                'wss://<HEROKU-SUBDOMAIN>.herokuapp.com:<PORT>/',
                'https://*.stripe.com',
                'https://*.mapbox.com',
                'https://*.cloudflare.com/',
                'https://bundle.js:*',
                'ws://localhost:*/',
            ],
        },
    },
});

// Use morgan as middleware only when I am in development mode.  
if(process.env.NODE_ENV === 'development') {
    app.use(morgan('dev'));
}

// Create a limiter that allows 100 requests from the same address per hour.  
const limiter = rateLimit({
    max: 100,
    window: 60 * 60 * 1000,
    message: 'Too many requests from this IP, please try again in an hour!'
});

// Use limiter as a middleware.  
app.use('/api', limiter);

// Body parser, reading data from body into req.body.  
// If req.body is more than 10kb, it will not be accepted.  
app.use(express.json({ limit: '10kb' }));

// Parse objects on every request.
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Parses the data from the cookie.  
app.use(cookieParser());

// Data sanitization against NoSQL query injection.  
app.use(mongoSanitize());

// Data sanitization against XSS, so I cannot add HTML codes in the input.  
app.use(xss());

// Prevent parameter pollution.  
app.use(hpp({
    whitelist: ['duration', 'ratingsQuantity', 'ratingsAverage', 'maxGroupSize', 'difficulty', 'price']
}));

// This middleware is invoked whenever a request hits the backend.  
// Here, the middleware function express.json() parses incoming JSON requests and puts the parsed data in req.body.  
app.use(express.json());

// Serve static files from the public directory.  
app.use(express.static(`${__dirname}/public`));

// Use compression as middleware.  
app.use(compression());

// Use a middleware to add a requestTime property to the req object, which is set to current time in string.  
app.use((req, res, next) => {
    req.requestTime = new Date().toISOString();
    // console.log(req.cookies);
    next();
});

// Use a middleware, viewRouter router is invoked whenever we send a request to localhost:3000.  
app.use('/', viewRouter);

// Use a middleware, tourRouter router is invoked whenever we send a request to localhost:3000/api/v1/tours.  
app.use('/api/v1/tours', tourRouter);

// Use a middleware, userRouter router is invoked whenever we send a request to localhost:3000/api/v1/users.  
app.use('/api/v1/users', userRouter);

// Use a middleware, reviewRouter router is invoked whenever we send a request to localhost:3000/api/v1/reviews.  
app.use('/api/v1/reviews', reviewRouter);

// Use a middleware, booking router is invoked whenever we send a request to localhost:3000/api/v1/bookings.  
app.use('/api/v1/bookings', bookingRouter);

// If the route doesn't fit any of the routes, all requests coming to it will go to a 404 page.  
// Call next to pass the error into the error handling middleware, use AppError class as a template to create a object.  
app.all('*', (req, res, next) => {
    next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// This is a middleware used to catch errors.  
// If there is a statusCode for err, set it to statusCode, otherwise, the default is 500.  
app.use(globalErrorHandler);

// Export the app object.  
module.exports = app;