// Use the a function to catch the error.  
module.exports = fn => {
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};