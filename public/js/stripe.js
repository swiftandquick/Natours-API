import axios from 'axios';
import { showAlert } from './alerts';

// Use stripe.  
const stripe = Stripe('pk_test_51O2jaWF5YlhcKHnuOnGa5k6YIdvuP9SWY4pP89pSBAsLsk2jsrDGDA3gmQZaqBbVwlF2SwVe8HbRuymEyTf59ciC00t4AXrOTT')

// Get checkout session from API.  
// Create checkout form and charge credit card.  
export const bookTour = async tourId => {
    try {
        const session  = await axios(
            `/api/v1/bookings/checkout-session/${tourId}`
        );
        // console.log(session);
        await stripe.redirectToCheckout({
            sessionId: session.data.session.id
        });
    }
    catch(err) {
        console.log(err);
        showAlert('error', err);
    }
}