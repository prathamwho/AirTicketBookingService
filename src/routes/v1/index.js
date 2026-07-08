const express = require('express');

const { BookingController } = require('../../controllers/index');
// const { createChannel } = require('../../utils/messageQueue');
// const channel = await createChannel();

const bookingController = new BookingController();
const router = express.Router();

router.get('/info', (req, res) =>{
    return res.json({message: 'Response from routes'});
});

router.get('/bookings/dashboard', bookingController.getDashboard);
router.post('/bookings', bookingController.create);
router.put('/bookings/:id/passengers', bookingController.savePassengers);
router.get('/bookings/:id/seat-map', bookingController.getSeatMap);
router.get('/bookings/:id/add-ons', bookingController.getAddOns);
router.put('/bookings/:id/selections', bookingController.saveSelections);
router.post('/bookings/:id/promo', bookingController.applyPromo);
router.post('/bookings/:id/payments/intent', bookingController.createPaymentIntent);
router.post('/bookings/:id/payments/confirm', bookingController.confirmPayment);
router.get('/bookings/:id/confirmation', bookingController.getConfirmation);
router.get('/bookings/:id/ticket', bookingController.getTicket);
router.post('/publish', bookingController.sendMessageToQueue);

module.exports = router;
