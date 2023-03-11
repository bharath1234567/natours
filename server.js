const mongoose = require('mongoose');
const dotenv = require('dotenv');
process.on('uncaughtException', (err) => {
  console.log('UNCAUGHT EXCEPION SUTTING DOWN');
  console.log(err.name, err.message);

  process.exit(1);
});

dotenv.config({ path: './config.env' });
const app = require('./app');

const DB = process.env.DATABASE.replace(
  '<PASSWORD>',
  process.env.DATABASE_PASSWORD
);

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: true,
    useUnifiedTopology: true
  })
  .then(() => {
    console.log('connection successful');
  });

const port = process.env.PORT || 3000;

const server = app.listen(port);

process.on('unhandledRejection', (err) => {
  console.log('UNHANDLED ERROR SHUTING DOWN');
  console.log(err);
  server.close(() => {
    process.exit(1);
  });
});

process.on('SIGTERM',()=>{
  server.close(()=>{
    console.log('process is terminating')
  })
})
