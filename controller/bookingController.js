
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const catchAsync = require("../utils/catchAsync");
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const handleFactory = require('./handlefactory')
exports.getCheckoutSession=catchAsync(async(req,res,next)=>{

    const tour = await Tour.findById(req.params.tourId)
// console.log('eeeeeeee',req.protocol,req.get("host"))
    const session = await stripe.checkout.sessions.create({
        payment_method_types:['card'],
        mode:'payment',
        success_url:`${req.protocol}://${req.get("host")}/my-tours/?tour=${tour._id}&user=${req.user.id}&price=${tour.price}`,
        cancel_url:`${req.protocol}://${req.get("host")}/tour/${tour.slug}`,
        customer_email: req.user.email,
        client_reference_id:req.params.tourId,
        line_items:[
            {
                quantity:1,
                price_data:{
                    
                    currency:'usd',
                    unit_amount : tour.price * 100,
                    product_data:{
                        description: tour.summary,
                        name:`${tour.name} Tour`,

                        images:[`https://www.natours.dev/img/tours/${tour.imageCover}`],
                    }
                }


            }
        ]
      
    })
    const paymentIntent = await stripe.paymentIntents.create({
        description: 'Software development services',
        shipping: {
          name: 'Jenny Rosen',
          address: {
            line1: '510 Townsend St',
            postal_code: '98140',
            city: 'San Francisco',
            state: 'CA',
            country: 'US',
          },
        },
        amount: 1099,
        currency: 'usd',
        payment_method_types: ['card'],
      });
res.status(200).json({
    status:'success',
    session
})
})

exports.createBookingCheckout = catchAsync(async(req,res,next)=>{
    const {tour,user,price} =req.query
// console.log('booked',tour)

    if(! tour && !user && !price) return next()
// console.log('booked')
    await Booking.create({tour,price,user})
    res.redirect(req.originalUrl.split('?')[0]);
})

exports.getAllBookings = handleFactory.getAll(Booking)
exports.getOneBooking = handleFactory.getOne(Booking)
exports.createBooking = handleFactory.createOne(Booking)
exports.updateBooking = handleFactory.updateOne(Booking)
exports.deleteBooking = handleFactory.deleteOne(Booking)
