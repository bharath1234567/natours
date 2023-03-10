const AppError = require('../utils/appError');

const handleCastErrorDB = (err) => {
  return new AppError(`Invalid ${err.path}: ${err.value}`);
};

const handleDuplicateFieldsDB = (err) => {
  const value = err.errmsg.match(/"((?:\\.|[^"\\])*)"/)[0];
  return new AppError(`Duplicate Field value : ${value}. please change`);
};
const handleValidationError = (err) => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data : ${errors.join('. ')}`;
  return new AppError(message, 400);
};
const sendErrorDev = (err,req, res) => {
  //development error
  if(req.originalUrl.startsWith('/api')){

    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
      error: err,
      stack: err.stack,
    });
  }
  return    res.status(err.statusCode).render('error',{
      title:'something went wrong',
      msg:err.message
    })
  
};

const handleJWTError = (err) =>
  new AppError('invalid token, please login again', 401);

const handleJWTExpiredError = (err) =>
  new AppError('jwt token expired,please login again', 401);
const sendErrorProd = (err,req, res) => {
  if(req.originalUrl.startsWith('/api')){

    //operational and trusted error sending to client
   
    if (err.isOperational) {
     return  res.status(err.statusCode).render('error',{
        title:'something went wrong',
        msg:err.message
      })
    }
    // programming or other error don't leak details to client
    else {
     return  res.status(err.statusCode).render('error',{
        title:'something went wrong',
        msg:'page not found. please try again later'
      })
    }
  }
  return  res.status(err.statusCode).render('error',{
    title:'something went wrong',
    msg:'something wrong'
  })
};

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  // console.log('nooo',process.env.NODE_ENV, process.env.NODE_ENV === 'production');

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err,req, res);
  } 
  // else if (process.env.NODE_ENV == 'production') {
  //   let error = { ...err };
  //   if (error.name === 'castError') error = handleCastErrorDB(error);

  //   if (err.code === 11000) error = handleDuplicateFieldsDB(error);

  //   if (err.name === 'ValidationError') error = handleValidationError(error);
  //   sendErrorProd(error,req, res);
  //   if (err.name === 'JsonWebTokenError') error = handleJWTError(error);

  //   if (err.name === 'TokenExpiredError') error = handleJWTExpiredError(error);
  // } 
  else {
    let error = { ...err };
    error.message = err.message
    if (error.name === 'castError') error = handleCastErrorDB(error);

    if (err.code === 11000) error = handleDuplicateFieldsDB(error);

    if (err.name === 'ValidationError') error = handleValidationError(error);
    sendErrorProd(error,req, res);
    if (err.name === 'JsonWebTokenError') error = handleJWTError(error);

    if (err.name === 'TokenExpiredError') error = handleJWTExpiredError(error);
    res.status(500).json({ status: 'failureeeeee' });
  }
};
