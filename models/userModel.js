// Require packages.  
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

// Require the built-in crypto module.  
const crypto = require('crypto');

// Schema for user.  
// email is the unique identifier for each user, so there can be no two same emails.  
// For email inputs, use a custom validator to check whether the input has the email format.  
// The default value for photo is 'default.jpg'.  
// role determines what the user is authorized to do, it's a string type with values of 'user', 'guide', 'lead-guide', and 'admin'.  
// The default role value is 'user'.  
// The password has minimum of 8 characters.  
// Use a custom validator to validate passwordConfirm, an error will occur if passwordConfirm isn't equal to password.  
// passwordChangedAt is a Date object, which specifies when the user last changed password.  
// passwordResetToken is a token in format of a String, it's used to reset password.  
// passwordResetExpires is a Date object that represents when the token expires.   
// active determines whether the account is active, by default it's true.  
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, "Please tell us your name."]
    },
    email: {
        type: String,
        required: [true, "Please tell us your email."],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, "Please provide a valid email."]
    },
    photo: {
        type: String,
        default: 'default.jpg'
    },
    role: {
        type: String,
        enum: {
            values: ['user', 'guide', 'lead-guide', 'admin'], 
            message: 'Role is either user, guide, lead-guide, or admin.'
        },
        default: 'user'
    },
    password: {
        type: String, 
        required: [true, "Please provide a password."],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String, 
        required: [true, "Please confirm your password."],
        validate: {
            validator: function(el) {
                return el === this.password;
            },
            message: 'Passwords are not the same!'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date, 
    active: {
        type: Boolean,
        default: true, 
        select: false
    }
});

// Comment out this function if I want to use --import.  
// A function will be call before the data is saved to the database, before save() or create() is invoked.  
// If password has not been modified, exit the function and call the next middleware.   
// Use bcrypt to hash the password, set passwordConfirmed to undefined.  
userSchema.pre('save', async function(next) {
    if(!this.isModified('password')) {
        return next();
    }
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordConfirm = undefined;
    next();
});

// Comment out this function if I want to use --import.  
// A function will be call before the data is saved to the database, before save() or create() is invoked.  
// If password has not been modified or the document is new, exit the function and call the next middleware.   
// Otherwise, set passwordChangedAt to now minus 1 second, and call the next middleware.  
userSchema.pre('save', function(next) {
    if(!this.isModified('password') || this.isNew) {
        return next();
    }
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

// A function will be call before the find type query such as findById() is invoked.  
// Only displays documents where active property is not false.  
userSchema.pre(/^find/, function(next) {
    this.find({ active: { $ne: false } });
    next();
});

// Compares the password entered (candidatePassword) to the actual password (userPassword), return true if they are equal.  
userSchema.methods.correctPassword = async function(candidatePassword, userPassword) {
    return await bcrypt.compare(candidatePassword, userPassword);
}

// By default, the user has no changed password, so it's false.
// If there's a passwordChangedAt value, convert it it to time in seconds and save it in changedTimestamp, then compare it to JWTTimestamp.  
// Return true if JWTTimestamp is less than changedTimestamp, which means password has been changed.  
userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return JWTTimestamp < changedTimestamp;
    }
    return false;
};

// Get a random 32 bytes string in hexadecimal format as a token.  
// Hash / encrypt the token, the reset token expires in 10 minutes.  
userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;
    // console.log({resetToken}, this.passwordResetToken);
    return resetToken;
}

// Create a model based on userSchema.  
const User = mongoose.model('User', userSchema);

module.exports = User;