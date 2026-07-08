const { StatusCodes } = require('http-status-codes');

const {
    Booking,
    BookingPassenger,
    BookingContact,
    BookingGSTDetail,
    BookingSelection,
    BookingPayment,
    BookingTicket
} = require('../models');
const { AppError, ValidationError } = require('../utils/errors/index');

class BookingRepository {
    async create(data) {
        try {
            const booking = await Booking.create(data);
            return booking;
        } catch (error) {
            if (error.name === 'SequelizeValidationError') {
                throw new ValidationError(error);
            }
            throw new AppError('RepositoryError',
                'Cannot create Booking',
                'There was issue creating the booking, please try again later',
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    }

    async update(bookingId, data) {
        try {
            const booking = await Booking.findByPk(bookingId);
            if(!booking) {
                throw new AppError(
                    'RepositoryError',
                    'Cannot update Booking',
                    'Booking was not found',
                    StatusCodes.NOT_FOUND
                );
            }
            if(data.status) {
                booking.status = data.status;
            }
            if(data.totalCost !== undefined) {
                booking.totalCost = data.totalCost;
            }
            if(data.noOfSeats !== undefined) {
                booking.noOfSeats = data.noOfSeats;
            }
            await booking.save();
            return booking;
        } catch (error) {
            throw new AppError(
                'RepositoryError', 
                'Cannot update Booking', 
                'There was some issue updating the booking, please try again later',
                StatusCodes.INTERNAL_SERVER_ERROR);
        }
    }

    async get(bookingId) {
        try {
            return await Booking.findByPk(bookingId);
        } catch (error) {
            throw new AppError(
                'RepositoryError',
                'Cannot fetch Booking',
                'There was some issue fetching the booking, please try again later',
                StatusCodes.INTERNAL_SERVER_ERROR
            );
        }
    }

    async savePassengers(bookingId, passengers = [], contact = {}, gst = {}) {
        await BookingPassenger.destroy({ where: { bookingId } });
        const savedPassengers = await BookingPassenger.bulkCreate(passengers.map((passenger, index) => ({
            bookingId,
            passengerRef: passenger.id || `traveller_${index + 1}`,
            type: passenger.type || 'adult',
            firstName: passenger.firstName,
            lastName: passenger.lastName,
            gender: passenger.gender,
            age: passenger.age,
            frequentFlyerNumber: passenger.frequentFlyerNumber
        })));

        const [savedContact] = await BookingContact.upsert({
            bookingId,
            phoneCountryCode: contact.phoneCountryCode || '+91',
            phone: contact.phone || '9876543210',
            email: contact.email || 'prathamraj@example.com'
        });

        const [savedGst] = await BookingGSTDetail.upsert({
            bookingId,
            enabled: Boolean(gst.enabled),
            companyName: gst.companyName || null,
            gstNumber: gst.gstNumber || null,
            state: gst.state || null
        });

        return { passengers: savedPassengers, contact: savedContact, gst: savedGst };
    }

    async getPassengers(bookingId) {
        const passengers = await BookingPassenger.findAll({ where: { bookingId } });
        const contact = await BookingContact.findOne({ where: { bookingId } });
        const gst = await BookingGSTDetail.findOne({ where: { bookingId } });
        return { passengers, contact, gst };
    }

    async saveSelections(bookingId, data = {}) {
        await BookingSelection.destroy({ where: { bookingId } });
        const rows = [
            ...(data.seats || []).map((seat) => ({
                bookingId,
                legId: seat.legId,
                seatNumber: seat.seatNumber
            })),
            ...(data.meals || []).map((meal) => ({
                bookingId,
                legId: meal.legId,
                mealId: meal.mealId
            })),
            ...(data.addOns || []).map((addOnId) => ({
                bookingId,
                legId: 'all',
                addOnId
            }))
        ];
        return BookingSelection.bulkCreate(rows);
    }

    async getSelections(bookingId) {
        return BookingSelection.findAll({ where: { bookingId } });
    }

    async createPayment(data) {
        return BookingPayment.create(data);
    }

    async updatePayment(paymentIntentId, data) {
        const payment = await BookingPayment.findOne({ where: { paymentIntentId } });
        if (!payment) return null;
        Object.assign(payment, data);
        await payment.save();
        return payment;
    }

    async findPayment(paymentIntentId) {
        return BookingPayment.findOne({ where: { paymentIntentId } });
    }

    async upsertTicket(data) {
        const [ticket] = await BookingTicket.upsert(data);
        return ticket;
    }

    async getTicket(bookingId) {
        return BookingTicket.findOne({ where: { bookingId } });
    }

    async getDashboard(userId) {
        const bookings = await Booking.findAll({
            where: { userId },
            order: [['createdAt', 'DESC']],
            limit: 20
        });
        const passengers = await BookingPassenger.findAll({
            where: {
                bookingId: bookings.map((booking) => booking.id)
            }
        });
        const tickets = await BookingTicket.findAll({
            where: {
                bookingId: bookings.map((booking) => booking.id)
            }
        });
        return { bookings, passengers, tickets };
    }

}
module.exports = BookingRepository;
