// Import packages.  
import axios from 'axios';

// Import from other files.  
import { showAlert } from './alerts';

// Use Axios to login via POST request sent to /api/v1/users/login.  
// If I successfully login, send an alert says I logged in and go to the home page, otherwise, send an alert that shows the error.  
export const login = async(email, password) => {
    try {
        const res = await axios({
            method: "POST",
            url: 'http://localhost:3000/api/v1/users/login',
            data: {
                email, 
                password
            }
        });
        if(res.data.status === 'success') {
            showAlert("success", "Logged in successfully!");
            window.setTimeout(() => {
                location.assign('/');
            }, 1500);
        }
        console.log(res);
    }
    catch(err) {
        showAlert("error", err.response.data.message);
    }
}

// Use Axios to login via GET request sent to /api/v1/users/logout.  
export const logout = async () => {
    try {
        const res = await axios({
            method: 'GET',
            url: 'http://localhost:3000/api/v1/users/logout'
        });
        if ((res.data.status = 'success')) location.reload(true);
    } 
    catch (err) {
        console.log(err.response);
        showAlert('error', 'Error logging out!  Try again.');
    }
};