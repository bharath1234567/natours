
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)
const catchAsync = require("../utils/catchAsync");
const Tour = require('../models/tourModel');
const Booking = require('../models/bookingModel');
const User = require('../models/userModel')
const handleFactory = require('./handlefactory')
exports.getCheckoutSession=catchAsync(async(req,res,next)=>{

    const tour = await Tour.findById(req.params.tourId)
// console.log('eeeeeeee',req.protocol,req.get("host"))
    const session = await stripe.checkout.sessions.create({
        payment_method_types:['card'],
        mode:'payment',
        success_url:`${req.protocol}://${req.get("host")}/my-tours`,
        
        // success_url:`${req.protocol}://${req.get("host")}/my-tours/?tour=${tour._id}&user=${req.user.id}&price=${tour.price}`,
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

                        images:[`${req.protocol}://${req.get("host")}/img/tours/${tour.imageCover}`],
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

// exports.createBookingCheckout = catchAsync(async(req,res,next)=>{
//     const {tour,user,price} =req.query
// // console.log('booked',tour)

//     if(! tour && !user && !price) return next()
// // console.log('booked')
//     await Booking.create({tour,price,user})
//     res.redirect(req.originalUrl.split('?')[0]);
// })

const checkoutSession =async (session)=>{
const tour =  session.client_reference_id
const user= (await User.findOne({email:session.customer_email})).id
const price =  session.line_items[0].price_data.unit_amount/100;

await Booking.create({tour,user,price}) 

}

exports.webhookCheckout=async(request,response,next)=>{

    const sig = request.headers['stripe-signature'];

    let event;
  
    try {
      event = stripe.webhooks.constructEvent(request.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      response.status(400).send(`Webhook Error: ${err.message}`);
      return;
    }
  
    // Handle the event
    // console.log(`Unhandled event type ${event.type}`);
    switch (event.type) {
        case 'checkout.session.completed':
          const checkoutSessionCompleted = event.data.object;
          // Then define and call a function to handle the event checkout.session.completed
            checkoutSession(checkoutSessionCompleted)

          break;
        // ... handle other event types
        default:
          console.log(`Unhandled event type ${event.type}`);
      }
  
    // Return a 200 response to acknowledge receipt of the event
    response.send();


}




exports.getAllBookings = handleFactory.getAll(Booking)
exports.getOneBooking = handleFactory.getOne(Booking)
exports.createBooking = handleFactory.createOne(Booking)
exports.updateBooking = handleFactory.updateOne(Booking)
exports.deleteBooking = handleFactory.deleteOne(Booking)
