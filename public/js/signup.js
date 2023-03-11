/* eslint-disable */
import axios from 'axios';
import { showAlert } from './alerts';

export const signup = async (formData) => {
  try {

    if(formData.password !== formData.passwordConfirm){
    return   showAlert('error', 'password are not same');

    }

    const res = await axios({
      method: 'POST',
      url: '/api/v1/users/signup',
      data: formData
    });
    
    if (res.data.status === 'success') {

      showAlert('success', 'signed-up  successfully!');
      window.setTimeout(() => {
        location.assign('/');
      }, 1500);
    }
  } catch (err) {
    showAlert('error', 'cannot able signup try after some time');
  }
};
