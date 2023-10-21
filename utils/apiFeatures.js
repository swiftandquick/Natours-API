// Use a class to contain methods, each method represents an API feature.  Return the current object in every method so I can chain the methods.  
// Create a queryObj which contains the query, for example, if I send a GET request to localhost:3000/api/v1/tours?duration=5&difficulty=easy, 
// queryObj will be { duration: 5, difficulty: "easy" }.  
// Stringify queryObj, then add $ in front of the keywords such as gte and lte to change the query into a proper mongoDB command.  
// Now if I send a GET request to localhost:3000/api/v1/tours?duration[gte]=5&difficulty=easy, queryObj will be { duration: {gte: 5}, difficulty: "easy" }, 
// queryStr will be { duration: {$gte: 5}, difficulty: "easy" }.  Parse it back to object, use Tour.find() to only display objects that match the parsedQueryStr. 
// If there's a sort query, sort the elements by the specified value.  
// If there's a fields query, only send back objects containing the properties of the fields.  
// For example, if I send a GET request to localhost:3000/api/v1/tours?fields=name,duration,difficulty,price, 
// then, only name, duration, difficulty, and price will be displayed for each object.  
// If a GET request is sent to localhost:3000/api/v1/tours?page=2&limit10, then each page has 10 items, and I will be shown items on page 2.  
// Retrieve the page from the query, if there's no page from query, page is 1.  
// Retrieve the limit from the query, if there's no limit from query, limit is 100.
// Calculate the skip, which is (page - 1) * limit.  Use skip() and limit() methods to skip to a certain page and display a certain amount of items on that page.  
// If there are no items on the page, which means skip is greater or equal to than numTours (# of documents in tours collection), throw an error.   
class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }
    filter() {
        const queryObj = {...this.queryString};
        const excludedFields = ['page', 'sort', 'limit', 'fields'];
        excludedFields.forEach(el => delete queryObj[el]);
        const queryStr = JSON.stringify(queryObj);
        const parsedQueryStr = JSON.parse(queryStr.replace(/\b(gte|gt|lte|lt)\b/g, match => `$${match}`));
        this.query.find(parsedQueryStr);
        return this;
    }
    sort() {
        if (this.queryString.sort) {
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
        }
        else {
            this.query = this.query.sort('-createdAt');
        }
        return this;
    }
    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        }
        else {
            this.query = this.query.select('-__v');
        }
        return this;
    }
    paginate() {
        const page  = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;
        this.query = this.query.skip(skip).limit(limit);
        return this;
    }
}

module.exports = APIFeatures;