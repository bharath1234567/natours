const AppError = require("../utils/appError");
const catchAsync = require("../utils/catchAsync");
const APIFeatures = require('../utils/apiFeatures');

exports.deleteOne = Model => catchAsync(async(req,res,next)=>{
  const doc =  await Model.findByIdAndDelete(req.params.id)
  if(!doc){
    return next(new AppError('no document found with id',404))
  }
  res.status(204).json({
    status:'success',
    data: {
        doc,
      },
  })
})

exports.updateOne = Model => catchAsync(async(req,res,next)=>{
  const doc = await Model.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!doc) {
    return next(new AppError('no document found with that id', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      doc,
    },
  });
})

exports.createOne = Model => catchAsync(async (req, res, next) => {
  const doc = await Model.create(req.body);

  res.status(201).json({
    status: 'success',
    data: {
      data: doc,
    },
  });
});

exports.getOne = (Model,populateOptions)=> catchAsync(async (req, res, next) => {
  let doc = Model.findById(req.params.id)
  if(populateOptions){
    doc = doc.populate('reviews')
  }

  doc = await doc
  if (!doc) {
    return next(new AppError('no document found with that id', 404));
  }
  res.status(200).json({
    status: 'success',
    data: {
      doc: doc,
    },
  });
});

exports.getAll = Model => catchAsync(async (req, res, next) => {

  // to allow for the nested GET reviews on tour (hack)
  let filter = {}
  if(req.params.tourId) filter = {tour:req.params.tourId}

  const features = new APIFeatures(Model.find(filter), req.query)
    .sort()
    .paginate()
    .filter()
    .limitFields();
  // const doc = await features.query.explain()
  const doc = await features.query

  res.status(200).json({
    message: 'succesccs',
    length: doc.length || 0,
    data: {
      data: doc,
    },
  });
});