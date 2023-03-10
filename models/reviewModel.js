const mongoose = require('mongoose')
const { findByIdAndDelete, findByIdAndUpdate } = require('./tourModel')
const Tour = require('./tourModel')

const reviewSchema = new  mongoose.Schema({
    review:{
        type:String,
        required:[true,'Review cannot be empty']
    },
    rating:{
        type:Number,
        min:1,
        max:5
      
    },
    createdAt:{
        type:Date,
        default:Date.now()
    },
    tour:{
        type: mongoose.Schema.ObjectId,
        ref:'Tour',
        required:[true,'Review must belong to a tour']
    },
    user:{
        type: mongoose.Schema.ObjectId,
        ref:'User',
        required:[true,'Review must made by a User']
    }

},{
    toJSON:{virtuals:true},
    toObject:{virtuals:true}
})

reviewSchema.index({tour:1,user:1},{unique:true})

reviewSchema.pre(/^find/,function(next){
    // this.populate({
    //     path:'tour',
    //     select:'name'
    // }).populate({
    //     path:'user',
    //     select:'name photo'
    // })
    // next()


    this.populate({
        path:'user',
        select:'name photo'
    })
    next()
})

reviewSchema.statics.calcRatingsAverage =  async function(tourId){

 const stats =    await this.aggregate([
        {
            $match:{tour:tourId}
        },{
            $group:{
                _id:'$tour',
                nRatings:{$sum:1},
                avgRating: {$avg:'$rating'}
            }
        }
    ])
    if(stats.length){

        await Tour.findByIdAndUpdate(tourId,{ratingAverage:stats[0].avgRating,ratingQuantity:stats[0].nRatings})
    }
    else{
        await Tour.findByIdAndUpdate(tourId,{ratingAverage:4.5,ratingQuantity:0})

    }
}

reviewSchema.post('save',function(){
    this.constructor.calcRatingsAverage(this.tour)
})
// these doesn't have document midlleware only query middleware
// findByIdAndDelete
// findByIdAndUpdate

reviewSchema.pre(/^findOneAnd/,async function(next){
    this.r = await Tour.findOne()
    // console.log(this.r)
    next()
})
reviewSchema.post(/^findOneAnd/, async function(){
    // this.r = await Tour.findOne(); this doesnot work here because query already executed

 await this.r.constructor.calcRatingsAverage(this.r.tour)
})

const review = mongoose.model('Review',reviewSchema)

module.exports = review