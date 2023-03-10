const util = require('util');
const crypto = require('crypto');
// const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const cathAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
// const sendEmail = require('../utils/email');
const Email =require('../utils/email')

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};
const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);
  const cookieOptions = {
    expires: new Date(
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 24 * 60 * 60 * 1000
    ),
    httpOnly: true,
  };

  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  res.cookie('jwt', token, cookieOptions);

  // remove password from output
  user.password = undefined;
  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user,
    },
  });
};

exports.signup = cathAsync(async (req, res, next) => {
  const newUser = await User.create(req.body);
  const url = `${req.protocol}://${req.get('host')}/me`;
await new Email(newUser,url).sendWelcome()

  createSendToken(newUser, 201, res);
  // next()
});

exports.login = catchAsync(async (req, res, next) => {
  const { email, password } = req.body;

  //checking email and password fields
  if (!email || !password) {
    next(new AppError('please enter password or email', 400));
  }
  //check user exists and password is correct
  const user = await User.findOne({ email }).select('+password');

  if (!user ) {
    return next(new AppError('incorrect email or password', 401));
  }
  const correct = await user.correctPassword(password, user.password);

  if (!user || !correct) {
    return next(new AppError('incorrect email or password', 401));
  }
  createSendToken(user, 200, res);
});

exports.logout = (req,res)=>{
res.cookie('jwt','loggedout',{
  expires: new Date(Date.now()+ 10*1000),
  httpOnly:true
})
res.status(200).json({
  status:'success'
})
}

exports.protect = catchAsync(async (req, res, next) => {
  // 1) getting token and check if it's there
console.log('request',req.cookie)
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  } else if (req.cookies.jwt) {
    token = req.cookies.jwt;
  }
  if (!token) {
    next(new AppError('please login to get access', 401));
  }
  // 2) verifying the token

  const decoded = await util.promisify(jwt.verify)(
    token,
    process.env.JWT_SECRET
  );

  // 3) verify the user exists

  const currentUser = await User.findById(decoded.id);

  if (!currentUser) {
    return next(new AppError('user with this token not present', 401));
  }

  // 4) check weather user changed password after jwt token issued

  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('user has changed the password please login again')
    );
  }

  // GRANT ACCESS TO USER

  req.user = currentUser;
  res.locals.user = currentUser

  next();
});

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    // roles = ['admin','lead-guide']

    if (!roles.includes(req.user.role)) {
      return next(new AppError('you are not allowed to do this action', 403));
    }

    next();
  };
};

exports.forgotPassword = catchAsync(async (req, res, next) => {
  // 1) get user based on entered email
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return next(new AppError('there is no user with an entered email', 404));
  }
  // 2) generate the random token

  const resetToken = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  // 3) send back the token to the email

  const resetURL = `${req.protocol}://${req.get(
    'host'
  )}/api/v1/users/resetPassword/${resetToken}`;

  const message = `forgot your password? submit a patch request with the new password and passwordConfirm to : ${resetURL}.\n If you didn't forgot the password please ignore email`;

  try {

    // const resetURL = `${req.protocol}://${req.get(
    //   'host'
    // )}/api/v1/users/resetPassword/${resetToken}`;
    await new Email(user, resetURL).sendPasswordReset();

    // await sendEmail({
    //   email: user.email,
    //   subject: 'your password reset token valid for 10mins only',
    //   message,
    // });

    res.status(200).json({
      status: 'success',
      message: `token sent to email`,
    });
  } catch (err) {
    user.passwordResetToken = undefined;
    user.passwordExpiresToken = undefined;

    await user.save({ validateBeforeSave: false });

    return next(new AppError('there was an error while sending an email', 500));
  }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
  // 1)get the user based on the token
  const hashedToken = crypto
    .createHash('sha256')
    .update(req.params.token)
    .digest('hex');

  const user = await User.findOne({
    passwordResetToken: hashedToken,
    passwordResetExpires: { $gt: Date.now() },
  });
  // 2)if the token is not expired and user exists reset the password
  if (!user) {
    return next(new AppError('Token is invalid or expired', 400));
  }

  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  user.passwordExpiresToken = undefined;
  user.passwordResetExpires = undefined;

  await user.save();
  // 3)update the changedpasswordAT property for the user
  // 4) log the user in and send the jwt
  createSendToken(user, 200, res);
});

exports.updatePassword = cathAsync(async (req, res, next) => {
  // 1)get user from the collection

  // const user = await User.findOne({
  //   email: req.body.email,
  //   password: { $eq: bcrypt.hash(req.body.password, 12) },
  // });
  // if (!user) {
  //   return next(new AppError('old password is not correct', 404));
  // }

  const user = await User.findById(req.user.id).select('+password');

  // 2) check the entered current password is correct

  if (!(await user.correctPassword(req.body.passwordCurrent, user.password))) {
    return next(new AppError('your current password is wrong', 401));
  }

  // 3) If so update the password
  user.password = req.body.password;
  user.passwordConfirm = req.body.passwordConfirm;
  await user.save();

  // 4) log user in send JWT
  createSendToken(user, 200, res);
});

// rendering pages on ui based on login
exports.isLoggedIn = async (req, res, next) => {
  // 1) getting token and check if it's there

  if (req.cookies?.jwt) {
    try{

    
    const decoded = await util.promisify(jwt.verify)(
      req.cookies.jwt,
      process.env.JWT_SECRET
    );

    // 3) verify the user exists

    const currentUser = await User.findById(decoded.id);

    if (!currentUser) {
      return next(new AppError('user with this token not present', 401));
    }

    // 4) check weather user changed password after jwt token issued

    if (currentUser.changedPasswordAfter(decoded.iat)) {
      return next(
        new AppError('user has changed the password please login again')
      );
    }

    // GRANT ACCESS TO USER
    res.locals.user = currentUser
    return next();
  
  }
catch(err){

 return  next();
}
};
next()
}
