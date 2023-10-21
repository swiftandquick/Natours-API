// Require fs module.  
const fs = require('fs');

// Require npm packages.  
const mongoose = require('mongoose'); 
const dotenv = require('dotenv');

// Require models from tourModel.js.
const Tour = require('./../../models/tourModel');
const Review = require('./../../models/reviewModel');
const User = require('./../../models/userModel');

// Connect to config.env via dotenv object.  
dotenv.config({path: './config.env'});

// Get the database link from config.env.  
const DB = process.env.DATABASE.replace("<PASSWORD>", process.env.DATABASE_PASSWORD);

// Connect to the database on MongoDB Atlas.  
mongoose.connect(DB, {
    useNewUrlParser: true, 
    useUnifiedTopology: true
}).then(() => console.log("Database connection established."));

// Synchronously read the tours.json, users.js, and reviews.js files, convert JSON into JavaScript object.  
const tours = JSON.parse(fs.readFileSync(`${__dirname}/tours.json`, 'utf-8'));
const users = JSON.parse(fs.readFileSync(`${__dirname}/users.json`, 'utf-8'));
const reviews = JSON.parse(fs.readFileSync(`${__dirname}/reviews.json`, 'utf-8'));

// Insert the objects from tours.json, users.json, and reviews.json as documents into the database.   
const importData = async() => {
    try {
        await Tour.create(tours);
        await User.create(users, { validateBeforeSave: false });
        await Review.create(reviews);
        console.log("Data is successfully loaded!");
    }
    catch(err) {
        console.log(err);
    }
    process.exit();
}

// Delete all documents from the tours, users, and reviews collection.  
const deleteData = async() => {
    try {
        await Tour.deleteMany();
        await User.deleteMany();
        await Review.deleteMany();
        console.log("Data is successfully deleted!");
    }
    catch(err) {
        console.log(err);
    }  
    process.exit();
}

// If the second argument of process.argv is --import, invoke importData.  
// If the second argument of process.argv is --delete, invoke deleteData.  
if(process.argv[2] === '--import') {
    importData();
}
else if(process.argv[2] === '--delete') {
    deleteData();
}