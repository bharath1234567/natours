const express = require('express');
const tourController = require('../controller/tourController');
const authController = require('../controller/authController');
// const reviewController = require('../controller/reviewController');
const reviewRouter = require('../routes/reviewRouter')
const router = express.Router();

// router.param('id', tourController.checkId);
router
  .route('/top-5-cheap')
  .get(tourController.aliasTopTours, tourController.getTours);

router.route('/tour-stats').get(tourController.tourStats);
router.route('/monthly-plan/:year').get(
  authController.protect,authController.restrictTo('admin','lead-guide','guide'),
  tourController.tourMonthlyPlan);

router
  .route('/')
  .get( tourController.getTours)
  .post(authController.protect,authController.restrictTo('admin','lead-guide'),  tourController.checkBody, tourController.createTour);


  router.route('/tours-within/:distance/center/:latlang/unit/:unit').get(tourController.getToursWithin)
  router.route('/distances/:latlang/unit/:unit').get(tourController.getDIstances)


  router
  .route('/:id')
  .get(tourController.getTour)
  .patch(authController.protect,authController.restrictTo('admin','lead-guide'),
  tourController.uploadTourImage,
  tourController.resizeTourImages,
  
  tourController.updateTour)
  .delete(
    authController.protect,
    authController.restrictTo('admin', 'lead-guide'),
    tourController.deleteTour
  );

  //POST /tour/23frkion79/reviews
  // GET  /tour/788nijnjknjk/reviews
  // GET   /tour/678hjbjmkn/reviews/hgghj678

  // router.route('/:tourId/reviews').post(authController.protect,authController.restrictTo('user'),reviewController.createReview)

  router.use('/:tourId/reviews',reviewRouter)

module.exports = router;
