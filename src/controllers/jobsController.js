const Job = require('../models/jobs');
const geocoder = require('../utils/geocoder');
const ErrorHandler = require('../utils/error-handler');
const catchAsyncErrors = require('../middlewares/catchAsyncErrors');

// Get all jobs => /api/v1/jobs
exports.getJobs = catchAsyncErrors(async (req, res, next) => {
  const jobs = await Job.find();

  res.status(200).json({
    success: true,
    results: jobs.length,
    data: jobs
  });
});

// Create a job => /api/v1/jobs/new
exports.newJob = catchAsyncErrors(async (req, res, next) => {
  const job = await Job.create(req.body);
  res.status(200).json({
    success: true,
    message: 'New job created',
    data: job
  });
});


// Get a single job => /api/v1/jobs/:id
exports.getJob = catchAsyncErrors(async (req, res, next) => {
  const job = await Job.find({ $and: [{ _id: req.params.id }, { slug: req.params.slug }] });

  if (!job || job.length === 0) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }

  res.status(200).json({
    success: true,
    data: job
  });

});

// Search Jobs with radius => /api/v1/jobs/:zipcode/:distance
exports.getJobsInRadius = catchAsyncErrors(async (req, res, next) => {
  const { zipcode, distance } = req.params;

  // Get lat/lng from geocoder
  const loc = await geocoder.geocode(zipcode);
  const lat = loc[0].latitude;
  const lng = loc[0].longitude;

  // Calc radius using radians
  // Divide distance by radius of Earth
  // Earth Radius = 3,963 mi / 6,378 km
  const radius = distance / 3963;

  const jobs = await Job.find({
    location: { $geoWithin: { $centerSphere: [[lng, lat], radius] } }
  });

  res.status(200).json({
    success: true,
    results: jobs.length,
    data: jobs
  });
});

// Get stats about a topic => /api/v1/stats/:topic
exports.getStats = catchAsyncErrors(async (req, res, next) => {
  const stats = await Job.aggregate([
    {
      $match: { $text: { $search: "/" + req.params.topic + "/" } }
    },
    {
      $group: {
        _id: { $toUpper: "$experience" },
        totalJobs: { $sum: 1 },
        avgPosition: { $avg: "$positions" },
        avgSalary: { $avg: "$salary" },
        minSalary: { $min: "$salary" },
        maxSalary: { $max: "$salary" }
      }
    }
  ]);

  if (stats.length === 0) {
    return res.status(404).json({ success: false, message: `No stats found for - ${req.params.topic}` });
  }

  res.status(200).json({
    success: true,
    data: stats
  });
});

// Update a job => /api/v1/jobs/:id
exports.updateJob = catchAsyncErrors(async (req, res, next) => {
  let job = await Job.findById(req.params.id);

  if (!job) {
    return next(new ErrorHandler('Job not found', 404));
  }

  job = await Job.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
    useFindAndModify: false
  });

  res.status(200).json({
    success: true,
    message: 'Job updated',
    data: job
  });
});

// Delete a job => /api/v1/jobs/:id
exports.deleteJob = catchAsyncErrors(async (req, res, next) => {
  const job = await Job.findById(req.params.id);

  if (!job) {
    return res.status(404).json({ success: false, message: 'Job not found' });
  }

  await job.remove();

  res.status(200).json({
    success: true,
    message: 'Job deleted'
  });
});
