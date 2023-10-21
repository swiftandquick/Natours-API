// Require packages.  
const multer = require('multer');
const sharp = require('sharp');

// Import User from tourModel.js.  
const User = require('./../models/userModel');

// Require function from catchAsync.js. 
const catchAsync = require('./../utils/catchAsync');

// Require AppError class from AppError.js.  
const AppError = require('./../utils/appError');

// Require functions from handlerFactory.js.  
const factory = require('./handlerFactory');

// Store the file in a buffer.  
const multerStorage = multer.memoryStorage();

// Filter out files that are not images.   
const multerFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image')) {
        cb(null, true);
    } else {
        cb(new AppError('Not an image! Please upload only images.', 400), false);
    }
};

// Set the storage and fileFilter.  
const upload = multer({ 
    storage: multerStorage,
    fileFilter: multerFilter
});

// since I am only updating a single image, upload invokes single() method, pass in 'photo' as argument.  
exports.uploadUserPhoto = upload.single('photo');

// Wrap the catchAsync function around the async function to catch the error without having the try-catch block.   
// If there's no req.file, go to the next function.  Otherwise, resize the image to 500 x 500 size jpeg image and send it to public/img/users.  
exports.resizeUserPhoto = catchAsync(async(req, res, next) => {
    if(!req.file) {
        return next();
    }
    else {
        req.file.filename = `user-${req.user.id}-${Date.now()}.jpeg`;
        await sharp(req.file.buffer)
            .resize(500, 500)
            .toFormat('jpeg')
            .jpeg({ quality: 90 })
            .toFile(`public/img/users/${req.file.filename}`);
        next();
    }
});

// First argument is the object itself, use rest operator to store rest of the arguments (string elements) in allowedFields array.  
// If obj (req.body) has the allowFields element, such as name or email, add the key-value pairs to newObj.  Return the updated newObj.  
const filterObj = (obj, ...allowedFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if(allowedFields.includes(el)) {
            newObj[el] = obj[el]
        }
    });
    return newObj;
}

// Get the current user.  
exports.getMe = (req, res, next) => {
    req.params.id = req.user.id;
    next();
};

// Wrap the catchAsync function around the async function to catch the error without having the try-catch block.   
// Create error if user posts password data.  
// Use filterObj() to only retrieve name and email from req.body, inputs that are not name or email are filtered out.  
// If req.file exists, set photo equals to req.file's filename.
// Update user document.  
exports.updateMe = catchAsync(async(req, res, next) => {
    if(req.body.password || req.body.passwordConfirm) {
        return next(new AppError("This route is not for password updates.  Please use /updateMyPassword.", 400));
    }
    const filteredBody = filterObj(req.body, 'name', 'email');
    if(req.file) {
        filteredBody.photo = req.file.filename;
    }
    const updatedUser = await User.findByIdAndUpdate(req.user.id, filteredBody, {new: true, runValidators: true},);
    res.status(200).json({
        status: 'success',
        data: {
            user: updatedUser
        }
    });
});

// Wrap the catchAsync function around the async function to catch the error without having the try-catch block.   
// Find the user by its ID and set active to false to deactivate the account.  
exports.deleteMe = catchAsync(async(req, res, next) => {
    await User.findByIdAndUpdate(req.user.id, { active: false });
    res.status(204).json({
        status: 'success',
        data: null
    });
});

exports.createUser = (req, res) => {
    res.send(500).json({
        status: 'error', 
        message: 'This route is not yet defined!  Please use /signup instead.'
    });
}

// Invoke getAll, pass in User as argument.  
exports.getAllUsers = factory.getAll(User);

// Invoke getOne, pass in User as argument.  
exports.getUser = factory.getOne(User);

// Invoke updateOne, pass in User as argument.  
// Do not update password with this.  
exports.updateUser = factory.updateOne(User);

// Invoke deleteOne, pass in User as argument.  
exports.deleteUser = factory.deleteOne(User);