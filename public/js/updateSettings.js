// Import packages.  
import axios from 'axios';

// Import from other files.  
import { showAlert } from './alerts';

// Use Axios to send a PATCH request to /api/v1/users/updateMe or /api/v1/users/updateMe to change the name and email or password.  
export const updateSettings = async (data, type) => {
    try {
        const url =
            type === 'password'
            ? '/api/v1/users/updateMyPassword'
            : '/api/v1/users/updateMe';
        const res = await axios({
            method: 'PATCH',
            url,
            data
        });
        if (res.data.status === 'success') {
            showAlert('success', `${type.toUpperCase()} updated successfully!`);
        }
    } catch (err) {
      showAlert('error', err.response.data.message);
    }
};