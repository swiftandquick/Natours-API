// Import packages. 
import '@babel/polyfill';

import { displayMap } from './mapbox';
import { login, logout } from './login';
import { updateSettings } from './updateSettings';
import { bookTour } from './stripe';

const mapBox = document.getElementById('map');
const loginForm = document.querySelector('.form--login');
const logoutBtn = document.querySelector('.nav__el--logout');
const userDataForm = document.querySelector('.form-user-data');
const userPasswordForm = document.querySelector('.form-user-password');
const bookBtn = document.getElementById('book-tour');

// If mapBox exists.  
// Get the locations dataset attribute from the element with id of set.  Transform the string to a JSON object.
// Invoke displayMap with locations as argument.  
if(mapBox) {
    const locations = JSON.parse(mapBox.dataset.locations);
    displayMap(locations);
}

// If loginForm exists.  
// Add an event when the form is submitted.  
// Cancels the cancelable default event on submission.  
// Set email and password equals to the input values.  
if(loginForm) {
    loginForm.addEventListener('submit', e => {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        login(email, password);
    });
}

// If logoutBtn exists.  
// Add an event on click, when clicked, invoke logout.  
if(logoutBtn) {
    logoutBtn.addEventListener('click', logout);
}

// If userDataForm exists.  
// Add an event on submit, when submitted, invoke updateSettings, submit the form data including name, email, and photo.  
if (userDataForm)
  userDataForm.addEventListener('submit', e => {
    e.preventDefault();
    const form = new FormData();
    form.append('name', document.getElementById('name').value);
    form.append('email', document.getElementById('email').value);
    form.append('photo', document.getElementById('photo').files[0]);
    console.log(form);
    updateSettings(form, 'data');
});

// If userPasswordForm exists.  
// Add an event on submit, when submitted, invoke updateSettings.  
if (userPasswordForm)
    userPasswordForm.addEventListener('submit', async e => {
        e.preventDefault();
        document.querySelector('.btn--save-password').textContent = 'Updating...';
        const passwordCurrent = document.getElementById('password-current').value;
        const password = document.getElementById('password').value;
        const passwordConfirm = document.getElementById('password-confirm').value;
        await updateSettings(
            { passwordCurrent, password, passwordConfirm },
            'password'
        );
        document.querySelector('.btn--save-password').textContent = 'Save password';
        document.getElementById('password-current').value = '';
        document.getElementById('password').value = '';
        document.getElementById('password-confirm').value = '';
    }
);

// If bookBtn exists.  
// Add an event on click, when clicked, invoke bookTour, pass in tourId as argument.  
if (bookBtn)
    bookBtn.addEventListener('click', e => {
        e.target.textContent = 'Processing...';
        const { tourId } = e.target.dataset;
        bookTour(tourId);
    }
);