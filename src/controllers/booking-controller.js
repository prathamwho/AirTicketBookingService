const { StatusCodes } = require('http-status-codes');
const { BookingService } = require('../services/index');

const { createChannel, publishMessage } = require('../utils/messageQueue');
const { REMINDER_BINDING_KEY } = require('../config/serverConfig');

const bookingService = new BookingService();

class BookingController {

    constructor() {
        this.create = this.create.bind(this);
        this.sendMessageToQueue = this.sendMessageToQueue.bind(this);
        this.savePassengers = this.savePassengers.bind(this);
        this.getSeatMap = this.getSeatMap.bind(this);
        this.getAddOns = this.getAddOns.bind(this);
        this.saveSelections = this.saveSelections.bind(this);
        this.applyPromo = this.applyPromo.bind(this);
        this.createPaymentIntent = this.createPaymentIntent.bind(this);
        this.confirmPayment = this.confirmPayment.bind(this);
        this.getConfirmation = this.getConfirmation.bind(this);
        this.getTicket = this.getTicket.bind(this);
        this.getDashboard = this.getDashboard.bind(this);
    }

    async sendMessageToQueue(req, res){
        const channel = await createChannel();
        const payload = {
            data: {
                subject: 'This is a notification from queue',
                content: 'Some queue will subscribe this',
                recepientEmail: 'isaidwhoasked@gmail.com',
                notificationTime: '2025-10-24T12:35:00'
            },
            service: 'CREATE_TICKET'
        };
        publishMessage(channel, REMINDER_BINDING_KEY, JSON.stringify(payload));
        return res.status(200).json({
            message: 'Succesfully published the event'
        });
    }

    async create (req, res) {
        try {
            const response = await bookingService.createBooking(req.body);
            console.log("FROM BOOKING CONTROLLER", response);
            return res.status(StatusCodes.OK).json({
                message: 'Successfully completed booking',
                success: true,
                err: {},
                data: response
            })
        } catch (error) {
            return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
                message: error.message || 'Something went wrong while creating the booking',
                success: false,
                err: error.explanation || error,
                data: {}
            });
        }
    }

    async savePassengers(req, res) {
        try {
            const response = await bookingService.savePassengers(req.params.id, req.body);
            return res.status(StatusCodes.OK).json({
                message: 'Successfully saved passengers',
                success: true,
                err: {},
                data: response
            });
        } catch (error) {
            return this.#errorResponse(res, error, 'Something went wrong while saving passengers');
        }
    }

    async getSeatMap(req, res) {
        try {
            const response = await bookingService.getSeatMap(req.params.id);
            return res.status(StatusCodes.OK).json({
                message: 'Successfully fetched seat map',
                success: true,
                err: {},
                data: response
            });
        } catch (error) {
            return this.#errorResponse(res, error, 'Something went wrong while fetching seat map');
        }
    }

    async getAddOns(req, res) {
        try {
            const response = await bookingService.getAddOns(req.params.id);
            return res.status(StatusCodes.OK).json({
                message: 'Successfully fetched add-ons',
                success: true,
                err: {},
                data: response
            });
        } catch (error) {
            return this.#errorResponse(res, error, 'Something went wrong while fetching add-ons');
        }
    }

    async saveSelections(req, res) {
        try {
            const response = await bookingService.saveSelections(req.params.id, req.body);
            return res.status(StatusCodes.OK).json({
                message: 'Successfully saved selections',
                success: true,
                err: {},
                data: response
            });
        } catch (error) {
            return this.#errorResponse(res, error, 'Something went wrong while saving selections');
        }
    }

    async applyPromo(req, res) {
        try {
            const response = await bookingService.applyPromo(req.params.id, req.body);
            return res.status(StatusCodes.OK).json({
                message: 'Successfully processed promo',
                success: true,
                err: {},
                data: response
            });
        } catch (error) {
            return this.#errorResponse(res, error, 'Something went wrong while applying promo');
        }
    }

    async createPaymentIntent(req, res) {
        try {
            const response = await bookingService.createPaymentIntent(req.params.id);
            return res.status(StatusCodes.OK).json({
                message: 'Successfully created payment intent',
                success: true,
                err: {},
                data: response
            });
        } catch (error) {
            return this.#errorResponse(res, error, 'Something went wrong while creating payment intent');
        }
    }

    async confirmPayment(req, res) {
        try {
            const response = await bookingService.confirmPayment(req.params.id, req.body);
            return res.status(StatusCodes.OK).json({
                message: 'Successfully confirmed payment',
                success: true,
                err: {},
                data: response
            });
        } catch (error) {
            return this.#errorResponse(res, error, 'Something went wrong while confirming payment');
        }
    }

    async getConfirmation(req, res) {
        try {
            const response = await bookingService.getConfirmation(req.params.id);
            return res.status(StatusCodes.OK).json({
                message: 'Successfully fetched confirmation',
                success: true,
                err: {},
                data: response
            });
        } catch (error) {
            return this.#errorResponse(res, error, 'Something went wrong while fetching confirmation');
        }
    }

    async getTicket(req, res) {
        try {
            const response = await bookingService.getTicket(req.params.id);
            return res.status(StatusCodes.OK).json({
                message: 'Successfully fetched ticket',
                success: true,
                err: {},
                data: response
            });
        } catch (error) {
            return this.#errorResponse(res, error, 'Something went wrong while fetching ticket');
        }
    }

    async getDashboard(req, res) {
        try {
            const response = await bookingService.getDashboard(req.query.userId || 1);
            return res.status(StatusCodes.OK).json({
                message: 'Successfully fetched dashboard',
                success: true,
                err: {},
                data: response
            });
        } catch (error) {
            return this.#errorResponse(res, error, 'Something went wrong while fetching dashboard');
        }
    }

    #errorResponse(res, error, fallbackMessage) {
        return res.status(error.statusCode || StatusCodes.INTERNAL_SERVER_ERROR).json({
            message: error.message || fallbackMessage,
            success: false,
            err: error.explanation || error,
            data: {}
        });
    }
}

module.exports = BookingController
