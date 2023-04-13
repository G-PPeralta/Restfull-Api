const express = require('express');

const app = express();
const dotenv = require('dotenv');

const connectDatabase = require('./database/database');
const errorMiddleware = require('./middlewares/errors');
const ErrorHandler = require('./utils/error-handler');

// Setting up config.env file variables
dotenv.config({ path: './config.env' });

// Handling uncaught exceptions

process.on('uncaughtException', err => {
  console.log(`Error: ${err.message}`);
  console.log('Shutting down the server due to uncaught exception');
  process.exit(1);
});

// Connecting to database
connectDatabase();

// Setting up body parser
app.use(express.json());

// Importing routes
const jobs = require('./routes/jobs');

app.use('/api/v1', jobs);

// Handle undhandled routes
app.all('*', (req, res, next) => {
  next(new ErrorHandler(`${req.originalUrl} route not found`, 404));
});


// Middleware to handle errors
app.use(errorMiddleware);

const PORT = process.env.PORT || 3000;
const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT} in ${process.env.NODE_ENV} node.`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', err => {
  console.log(`Error: ${err.message}`);
  console.log('Shutting down the server due to unhandled promise rejection');
  server.close(() => {
    process.exit(1);
  });
});
