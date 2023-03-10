const mongoose = require('mongoose');
const slugify = require('slugify');
// const User = require('./userModel')
const tourSchema = new mongoose.Schema(
  {
    name: {
      required: [true, 'A tour must have name'],
      type: String,
      unique: true,
      trim: true,
      maxlength: [
        40,
        'A tour name must have max of 40 or less then characters',
      ],
      minlength: [
        10,
        'A tour name must have min of 10 or more then characters',
      ],
    },
    slug: String,
    duration: {
      type: Number,
      required: [true, 'A tour must have duration'],
    },
    maxGroupSize: {
      type: Number,
      required: [true, 'a tour must have group size'],
    },
    difficulty: {
      type: String,
      required: ['true', 'a tour must have a difficulty'],
      enum: {
        values: ['easy', 'medium', 'difficult'],
        message: ' A difficulty is either: medium,easy,difficult',
      },
    },
    ratingAverage: {
      type: Number,
      default: 4.5,
      min: [1, 'rating average must greater than 1'],
      max: [5, 'rating average must less than 5'],
      set: val=>Math.round(val*10)/10
    },
    ratingQuantity: {
      type: Number,
      default: 0,
    },
    price: {
      required: [true, 'A tour must have price'],
      type: Number,
    },
    rating: {
      type: Number,
      default: 4.5,
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (val) {
          // this keyword refered to current doc on new document creation
          return val < this.price; //250<200
        },
        message: 'price discount ({VALUE}) is greater than price',
      },
    },

    summary: {
      type: String,
      trim: true,
      required: [true, 'a tour must have a summary'],
    },
    description: {
      type: String,
      trim: true,
    },
    imageCover: {
      type: String,
      required: [true, 'a tour must have image'],
    },
    images: [String],
    createdAt: {
      type: Date,
      default: Date.now(),
      select: false,
    },
    startDates: [Date],
    secretTour: {
      type: Boolean,
      default: false,
    },
startLocation:{
  // GeoJSON
  type:{
    type:String,
    default:'Point',
    enum:['Point']
  },
  coordinates:[Number],
  address:String,
  description:String
},
locations:[{
  type:{
    type:String,
    default:'Point',
    enum:['Point']
  },
  coordinates:[Number],
  address:String,
  description:String,
  day:Number

}],
guides:[
  {
   
      type: mongoose.Schema.ObjectId,
      ref:'User'
    
  }
]



  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);
// tourSchema.index({price:1})
tourSchema.index({price:1,ratingAverage:-1})
tourSchema.index({startLocation:'2dsphere'})


tourSchema.virtual('durationWeeks').get(function () {
  return this.duration / 7;
});

//Virtual populate
tourSchema.virtual('reviews',{
  ref: "Review",
  foreignField:'tour',
  localField:'_id'
})

// document middleware runs before save() and create()

tourSchema.pre('save', function (next) {
  this.slug = slugify(this.name, { lower: true });
  next();
});

// fetching data from user model and saving in the tour model when guides fields are given
/*
tourSchema.pre('save',async function(next){
 const guidesPromises =  this.guides.map(async id=> await User.findById({_id:id}))
 this.guides = await Promise.all(guidesPromises)

  next()
}) 
*/

//middleware run before to populate data from user model
tourSchema.pre(/^find/,function(next){
  this.populate({
    path:'guides',
    select:'-__v -passwordResetToken'
  })
  next()
})

tourSchema.pre(/^find/, function (next) {
  this.find({ secretTour: { $ne: true } });
  next();
});

// tourSchema.post(/^find/,function(docs,next){
//   console.log(docs)
//   next()
// })

// aggregation middleware
// tourSchema.pre('aggregate', function (next) {
//   // console.log(this)
//   this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
//   next();
// });
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;
