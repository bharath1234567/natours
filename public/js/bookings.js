/*disable-eslint*/
import axios from 'axios';
import {ShowAlerts} from '../js/alerts'

const stripe = Stripe('pk_test_51MjMO9SHVYNIsYE15Ra4HOJuj7WBRFNj9UFpcsuLqB2BbBuxDbKyneXcXyyfn4EpSYeqwGqDy8ztGWIq5Zi1rd4I00gM3wNncL')

export const tourBookings = async tourId => {
try{
const session = await axios(`/api/v1/bookings/checkout-session/${tourId}`)

stripe.redirectToCheckout({sessionId: session.data.session.id})

}catch(err){
    // console.log(err)
    ShowAlerts('err',err)
}
}