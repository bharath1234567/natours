const express = require('express')
const authController = require('../controller/authController')
const bookingController = require('../controller/bookingController')
const viewsController = require('../controller/viewsController')
const router = express.Router()





router.get('/', authController. isLoggedIn, viewsController.getOverview);
  
 
  router.get('/tour/:slug',authController. isLoggedIn, viewsController.getTour);
  

  router.get('/login',authController. isLoggedIn,viewsController.getLoginForm)
  router.get('/signup',authController. isLoggedIn,viewsController.getSignupForm)

  router.get('/me',authController. protect,viewsController.getAccount)
  router.get('/my-tours',authController. protect, bookingController.createBookingCheckout,  viewsController.myTours)



module.exports = router