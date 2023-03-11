const Tour = require('../models/tourModel')
const User = require('../models/userModel')
const Review = require('../models/reviewModel')
const AppError = require('../utils/appError')
const catchAsync = require('../utils/catchAsync')
const Booking = require('../models/bookingModel')

exports.getOverview = catchAsync(async (req, res,next) => {
    const tours = await Tour.find()
    res.status(200).render('overview', {
        title: 'All tours',

      tours
    });

})

exports.getTour = catchAsync(async(req, res,next) => {

const {slug} = req.params

const tour = await Tour.findOne({ slug}).populate({path:'reviews',select:"review rating user"})

// const guide = await User.find(...tour[0].guides)


if (!tour) {
  return next(new AppError('There is no tour with that name.', 404));
}


    res.status(200).render('tour', {

      title: tour.name,
      tour
    });
  })
 

  exports.getLoginForm = catchAsync(async(req,res,next)=>{
         res.status(200).render('login',{
          title:'Login into your account'
         })


  })

exports.getSignupForm = catchAsync(async(req,res,next)=>{
  res.status(200).render('signup',{
    title:'Signup for an account'
   })
})

  exports.getAccount= catchAsync(async(req,res,next)=>{
    // console.log('aaaacccc')
   return res.status(200).render('account',{
      title:'profile',

    })
  })
  exports.myTours = catchAsync(async(req,res,next)=>{
    const toursBooked = await Booking.find({user:req.user.id})

    const tourIds = await toursBooked.map(el=>el.tour)

    const tours = await Tour.find({_id:{$in:tourIds}})
// console.log("tours",tours)
    res.status(200).render('overview',{
      title:'my-tours',
      tours
    })
// next()

  })