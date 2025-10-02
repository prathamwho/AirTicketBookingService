const { StatusCodes } = require('http-status-codes');

const { Booking } = require('../models/booking');
const { AppError, ValidationError } = require('../utils/errors/index');

class BookingRepository {
    async create(data) {
        try {
            const booking = await Booking.create();
            return booking;
        } catch (error) {
            if (error.name = 'SequelizeValidationError') {
                throw new ValidationError(error);
            }
            throw new AppError('RepositoryError',
                'Cannot create Booking',
                'There was issue creating the booking, please try again later',
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    }
}
module.exports = BookingRepository;