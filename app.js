const fs = require('fs');
const express = require('express');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitise = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const path = require('path');
const cookieParser = require('cookie-parser')
const compression = require('compression')
const cors = require('cors')

const AppError = require('./utils/appError');
const globalErrorHandler = require('./controller/errorController');
const tourRouter = require('./routes/tourRouter');
const userRouter = require('./routes/userRouter');
const reviewRouter = require('./routes/reviewRouter');
const viewsRouter = require('./routes/viewsRouter')
const bookingRouter = require('./routes/bookingRouter');
const bookingController = require('./controller/bookingController');
const app = express();

app.enable('trust proxy')

app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// GLOBAL MIDLLEWARES

// serving static files
app.use(cors())
app.options('*',cors())
app.use(express.static(path.join(__dirname, 'public')));

// set security HTTP headers
// app.use(helmet());

// development logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// limit requests from same api
const limiter = rateLimit({
  max: 100,
  windowsMs: 60 * 60 * 1000,
  message: 'too many requests from this IP please try after an hour',
});
app.use('/api', limiter);

// Body parser, reading data from body into req.body

app.use(express.json({ limit: '10kb' }));
app.use(cookieParser())

// DATA SANITIZATION against NOSQL Query Injection
app.use(mongoSanitise());

// DATA SANITIZATION against XSS
app.use(xss());

// Http parameter pollution
app.use( 
  hpp({
    whitelist: ['duration', 'ratingAverage', 'rating', 'difficulty', 'price'],
  })
);

app.use(compression())

// Test middlewares

// app.use((req, res, next) => {
//   console.log('middleware');
//   next();
// });

// ROUTES
app.post('/checkout-tour',  express.raw({type: 'application/json'}),  bookingController.webhookCheckout)

app.use('/api/v1/tours', tourRouter);
app.use('/api/v1/users', userRouter);
app.use('/api/v1/reviews', reviewRouter);
app.use('/api/v1/bookings', bookingRouter);

app.use('/',viewsRouter)

app.all('*', (req, res, next) => {
  // res.status(404).json({
  //   status: 'fail',
  //   message: ` the url ${req.originalUrl} not found`,
  // });
  // const err = new Error(`the url ${req.originalUrl} not found`);
  // err.statusCode = 404;
  // err.status = 'fail';
  next(new AppError(` the url ${req.originalUrl} not found`, 404));
});
app.use(globalErrorHandler);

module.exports = app;
