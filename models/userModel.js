const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');
const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'please tell your name'],
    },
    email: {
      type: String,
      unique: true,
      required: [true, 'please type your email'],
      lowercase: true,
      validate: [validator.isEmail, 'please provide valid email'],
    },
    password: {
      type: String,
      required: [true, 'please provide the password'],
      minlength: 8,
      select: false,
    },
    role: {
      type: String,
      enum: ['user', 'guide', 'lead-guide', 'admin'],
      default: 'user',
    },
    photo: {type:String,default:'default.jpg'},
    passwordConfirm: {
      type: String,
      required: [true, 'please confirm password'],
      validate: {
        validator: function (el) {
          return el === this.password;
        },
        message: 'password is not same bro',
      },
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active:{
      type:Boolean,
      default:true,
      select:false
    }
  },
  {}
);

userSchema.pre(/^find/,function(next){
  // this points to current query
  this.find({active:{$ne:false}})
  next()
})



userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();

  this.passwordChangedAt = Date.now() - 1000;
  next();
});

userSchema.pre('save', async function (req, res, next) {
  // if password field is changed
  if (!this.isModified('password')) return next();

  // hash the password with cost of 12
  this.password = await bcrypt.hash(this.password, 12);

  // deleting the this.passwordConfirm field
  this.passwordConfirm = undefined;
  next();
});

userSchema.methods.correctPassword = async function (
  candidatePassword,
  userPassword
) {
  return await bcrypt.compare(candidatePassword, userPassword);
};

// userSchema.method(
//   'correctPassword',
//   async function (candidatePassword, userPassword) {
//     console.log(
//       'aaaaaaaaaaaaaaaa',
//       bcrypt.compare(candidatePassword, userPassword)
//     );
//     return await bcrypt.compare(candidatePassword, userPassword);
//   }
// );

userSchema.methods.changedPasswordAfter = (JWTTimeStamp) => {
  if (this.passwordChangedAt) {
    // console.log(JWTTimeStamp, this.passwordChangedAt);

    const changedTimeStamp = parseInt(
      this.passwordChangedAt.getTime() / 1000,
      10
    );

    return JWTTimeStamp < changedTimeStamp;
  }
  // false means not changed
  return false;
};

userSchema.methods.createPasswordResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString('hex');
  this.passwordResetToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
  // console.log({ resetToken }, this.passwordResetToken);
  return resetToken;
};

const User = mongoose.model('User', userSchema);
module.exports = User;
