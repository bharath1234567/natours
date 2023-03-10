
const multer= require('multer')
const sharp = require('sharp')
const User = require('../models/userModel');
const catchAsync = require('../utils/catchAsync');
const fs = require('fs');
const AppError = require('../utils/appError');
const factory = require('./handlefactory')
const tours = JSON.parse(
  fs.readFileSync(`${__dirname}/../dev-data/data/tours-simple.json`)
);4

const filteredObj = (obj,...requiredFields)=>{
  const newObj = {};
  Object.keys(obj).forEach(el=>{
    if(requiredFields.includes(el)){
      newObj[el]=obj[el]
    }
  })
  return newObj
}

// const multerStorage = multer.diskStorage({
//   destination:(req,file,cb)=>{
//     cb(null,'public/img/users')
//   },
//   filename:(req,file,cb)=>{
//     const ext = file.mimetype.split('/')[1]
//     cb(null,`user-${req.user.id}-${Date.now()}.${ext}`)
//   }
// })

const multerStorage = multer.memoryStorage()

const multerFileFilter = (req,file,cb)=>{
  if(file.mimetype.startsWith('image')){
    cb(null,true)
  }else{
    cb(new AppError('please up[load image only',404),false)
  }
}
const upload = multer({
  storage:multerStorage,
  fileFilter:multerFileFilter
})

exports.uploadUserPhoto = upload.single('photo')

exports.resizeUserPhoto= catchAsync(async(req,res,next)=>{
  if(!req.file) return next()
req.file.filename=`user-${req.user.id}-${Date.now()}.jpeg`

 await sharp(req.file.buffer).resize(500,500).toFormat('jpeg').jpeg({quality:95}).toFile(`public/img/users/${req.file.filename}`)

next()
})

exports.updateMe = catchAsync(async(req,res,next)=>{
  console.log(req.body)
  // 1) if password or confirm paswword exists send error
  if(req.body.password || req.body.passwordConfirm){
    return next(new AppError('this route is only for the name email update , please use /updatePassword route',404))
  }

  // 2) filetered the req.body with the required fields
  const filteredBody = filteredObj(req.body,'name','email')
  if(req.file) filteredBody.photo=req.file.filename

  // 3)if name or email entered update the document

  const updatedUser = await User.findByIdAndUpdate(req.user.id,filteredBody,{new:true,runValidators:true})



  res.status(200).json({
    status:'success',
    data:{
      user:updatedUser
    }

  })
})

exports.deleteMe = catchAsync(async(req,res,next)=>{
  await User.findByIdAndUpdate(req.user.id,{active:false})

  res.status(204).json({
    status:'success',
    data:null
  })
})

exports.getMe = (req,res,next)=>{
  req.params.id = req.user.id
  next()
}

exports.getAllUsers = factory.getAll(User)
exports.createUser = factory.createOne(User)
exports.getUser = factory.getOne(User)

//do not update the password
exports.updateUser = factory.updateOne(User)
exports.deleteUser = factory.deleteOne(User)