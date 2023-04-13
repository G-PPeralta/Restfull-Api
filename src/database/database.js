const mongoose = require('mongoose');

const databaseURL = process.env.DATABASE_LOCAL_URI || "mongodb://localhost:27017/jobs";

mongoose.set('strictQuery', false);

const connectDatabase = () => {
  mongoose.connect(databaseURL, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }).then(() => {
    console.log(`DB connection successful with host: ${mongoose.connection.host}`);
  }).catch((error) => {
    console.error(`DB connection failed: ${error.message}`);
  });
};

module.exports = connectDatabase;
