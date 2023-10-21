// Type in "nodemon server.js" to start the server.  
// Type in "node dev-data/data/import-dev-data.js --delete" to delete the documents from tours collection.  
// Type in "node dev-data/data/import-dev-data.js --import" to import the data from tours.json to tours collection.  
// Comment out two functions in userModel.js if I want to use --import.  

// Require npm packages.
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// If there's an uncaught exception, print out the error and exit out of the app.  
process.on('uncaughtException', err => {
    console.log(err.name, err.message);
    console.log("Uncaught exception!  Shutting down!");
    process.exit(1);
});

// Connect to config.env via dotenv object.  
dotenv.config({ path: './config.env' });

// Require the app object from app.js.  
const app = require('./app');

// Get the database link from config.env.  
const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

// Connect to the database on MongoDB Atlas.  
mongoose.connect(DB, {
    useNewUrlParser: true, 
    useUnifiedTopology: true
}).then(() => console.log("Database connection established."));

// Set the port to 3000.  
const port = process.env.PORT || 3000;

// Listen to the port.  
app.listen(port, () => {
    console.log(`App running on port ${port}.`);
});

// If there's an unhandled rejection, print out the error and exit out of the app.  
process.on('unhandledRejection', err => {
    console.log(err.name, err.message);
    console.log("Unhandled rejection!  Shutting down!");
    server.close(() => {
        process.exit(1);
    });
});
