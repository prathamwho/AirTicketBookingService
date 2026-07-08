const axios = require('axios');

const { BookingRepository } = require('../repository/index');
const { FLIGHT_SERVICE_PATH, REMINDER_BINDING_KEY } = require('../config/serverConfig');
const { ServiceError } = require('../utils/errors');
const { createChannel, publishMessage } = require('../utils/messageQueue');

class BookingService {
    constructor() {
        this.bookingRepository = new BookingRepository();
    }

    async createBooking(data) {
        try {
            const flightId = String(data.flightId).replace('flight_', '');
            const noOfSeats = data.noOfSeats || data.passengers?.adults || 1;
            const userId = data.userId || 1;
            const getFlightRequestURL = `${FLIGHT_SERVICE_PATH}/api/v1/flights/${flightId}`;
            const response = await axios.get(getFlightRequestURL);
            const flightData = response.data.data;
            let priceOfTheFlight = flightData.price;
            if(noOfSeats > flightData.totalSeats) {
                throw new ServiceError('Something went wrong in the booking process', 'Insufficient seats in the flight');
            }
            const totalCost = priceOfTheFlight * noOfSeats;
            const bookingPayload = {...data, flightId, userId, noOfSeats, totalCost};
            const booking = await this.bookingRepository.create(bookingPayload);
            const updateFlightRequestURL = `${FLIGHT_SERVICE_PATH}/api/v1/flights/${booking.flightId}`;
            console.log(updateFlightRequestURL);
            await axios.patch(updateFlightRequestURL, {totalSeats: flightData.totalSeats - booking.noOfSeats});
            const finalBooking = await this.bookingRepository.update(booking.id, {status: "Booked"});
            return this.#buildBookingDetailsResponse(finalBooking, flightData);
        } catch (error) { 
            console.log(error);
            if(error.name == 'RepositoryError' || error.name == 'ValidationError') {
                throw error;
            }
            throw new ServiceError();
        }
    }

    async savePassengers(bookingId, data) {
        const numericBookingId = this.#normalizeBookingId(bookingId);
        await this.bookingRepository.savePassengers(
            numericBookingId,
            data.passengers || [],
            data.contact || {},
            data.gst || { enabled: false }
        );
        return {
            bookingId,
            passengers: data.passengers || [],
            contact: data.contact || {},
            gst: data.gst || { enabled: false }
        };
    }

    async getSeatMap(bookingId) {
        return {
            bookingId,
            legs: [
                this.#buildSeatLeg('leg_outbound', 'DEL -> BLR'),
                this.#buildSeatLeg('leg_inbound', 'BLR -> DEL')
            ]
        };
    }

    async getAddOns(bookingId) {
        return {
            bookingId,
            baggage: [
                { id: 'bag_15kg_extra', title: 'Extra Check-in Baggage', detail: '15 kg', price: this.#money(14.24, 'EUR') }
            ],
            seats: [
                { id: 'seat_standard', title: 'Standard Seat', price: this.#money(3.55, 'EUR') },
                { id: 'seat_preferred', title: 'Preferred Seat', price: this.#money(6.20, 'EUR'), recommended: true },
                { id: 'seat_extra_legroom', title: 'Extra Legroom', price: this.#money(12, 'EUR') }
            ],
            meals: [
                { id: 'meal_veg', title: 'Veg Meal', price: this.#money(6.66, 'EUR') },
                { id: 'meal_combo', title: 'Meal Combo', price: this.#money(6.66, 'EUR') }
            ],
            protection: [
                { id: 'travel_guard_plus', title: 'Travel Guard Plus', recommended: true, price: this.#money(9.12, 'EUR') }
            ]
        };
    }

    async saveSelections(bookingId, data) {
        await this.bookingRepository.saveSelections(this.#normalizeBookingId(bookingId), data);
        return {
            bookingId,
            seats: data.seats || [],
            meals: data.meals || [],
            addOns: data.addOns || []
        };
    }

    async applyPromo(bookingId, data) {
        const discount = data.code === 'AGTRIP25' ? 4.69 : 0;
        return {
            bookingId,
            code: data.code,
            applied: discount > 0,
            message: discount > 0 ? 'Promo code applied' : 'Promo code is not valid',
            discount: this.#money(discount, 'EUR'),
            fareSummary: {
                total: this.#money(156.14 - discount, 'EUR')
            }
        };
    }

    async createPaymentIntent(bookingId) {
        const numericBookingId = this.#normalizeBookingId(bookingId);
        const paymentIntentId = `pay_${numericBookingId}_${Date.now()}`;
        await this.bookingRepository.createPayment({
            bookingId: numericBookingId,
            paymentIntentId,
            amount: 156.14,
            currency: 'EUR',
            status: 'requires_payment'
        });
        return {
            paymentIntentId,
            bookingId,
            amount: this.#money(156.14, 'EUR'),
            supportedMethods: ['card'],
            status: 'requires_payment'
        };
    }

    async confirmPayment(bookingId, data) {
        const numericBookingId = this.#normalizeBookingId(bookingId);
        if (/^\d+$/.test(numericBookingId)) {
            try {
                if (data.paymentIntentId) {
                    await this.bookingRepository.updatePayment(data.paymentIntentId, { status: 'paid' });
                }
                await this.bookingRepository.update(numericBookingId, { status: 'Booked' });
                const ticket = await this.#ensureTicket(numericBookingId);
                await this.#publishBookingConfirmation(numericBookingId, ticket);
            } catch (error) {
                console.log('Skipping booking status update for prototype payment confirmation', error.message);
            }
        }
        return {
            paymentIntentId: data.paymentIntentId || `pay_${bookingId}`,
            status: 'paid',
            bookingStatus: 'confirmed',
            bookingReference: this.#bookingReference(bookingId)
        };
    }

    async getConfirmation(bookingId) {
        const numericBookingId = this.#normalizeBookingId(bookingId);
        const savedPassengerData = await this.#getSavedPassengerData(numericBookingId);
        const savedSelections = await this.#getSavedSelectionSummary(numericBookingId);
        const ticket = await this.#ensureTicket(numericBookingId);

        return {
            bookingId,
            bookingReference: ticket?.bookingReference || this.#bookingReference(bookingId),
            status: 'confirmed',
            confirmationSentTo: {
                email: savedPassengerData.contact?.email || 'prathamraj@example.com',
                phone: this.#formatPhone(savedPassengerData.contact)
            },
            trip: this.#tripSummary(),
            traveller: savedPassengerData.traveller,
            selections: savedSelections
        };
    }

    async getTicket(bookingId) {
        const numericBookingId = this.#normalizeBookingId(bookingId);
        const savedPassengerData = await this.#getSavedPassengerData(numericBookingId);
        const savedSelections = await this.#getSavedSelectionSummary(numericBookingId);
        const ticket = await this.#ensureTicket(numericBookingId);

        return {
            bookingReference: ticket?.bookingReference || this.#bookingReference(bookingId),
            pnr: ticket?.pnr || `AG${String(numericBookingId).padStart(4, '0')}`,
            passenger: {
                name: savedPassengerData.traveller.name,
                type: savedPassengerData.traveller.type
            },
            legs: [
                {
                    legId: 'leg_outbound',
                    flightNumber: '6E 322',
                    from: 'DEL',
                    to: 'BLR',
                    departure: '2026-06-21T22:55:00+05:30',
                    arrival: '2026-06-22T01:05:00+05:30',
                    seat: savedSelections.seat,
                    meal: savedSelections.meal,
                    baggage: savedSelections.baggage,
                    barcode: ticket?.barcode || `${this.#bookingReference(bookingId)}-DEL-BLR-${savedSelections.seat}`
                }
            ],
            notes: [
                'Check-in closes 60 minutes before departure.',
                'Carry a valid photo ID proof.'
            ]
        };
    }

    async getDashboard(userId = 1) {
        const { bookings, passengers, tickets } = await this.bookingRepository.getDashboard(userId);
        const passengerByBooking = new Map(passengers.map((passenger) => [passenger.bookingId, passenger]));
        const ticketByBooking = new Map(tickets.map((ticket) => [ticket.bookingId, ticket]));

        const mappedBookings = bookings.map((booking) => {
            const ticket = ticketByBooking.get(booking.id);
            return {
                bookingId: `booking_${booking.id}`,
                bookingReference: ticket?.bookingReference || this.#bookingReference(booking.id),
                route: `Flight ${booking.flightId}`,
                date: this.#date(booking.createdAt),
                status: booking.status
            };
        });

        const savedTravellers = [...new Map(passengers.map((passenger) => [
            `${passenger.firstName}-${passenger.lastName}`,
            {
                id: passenger.passengerRef || `traveller_${passenger.id}`,
                name: `${passenger.firstName} ${passenger.lastName}`,
                type: passenger.type
            }
        ])).values()];

        return {
            upcomingTrips: mappedBookings.filter((booking) => booking.status !== 'Cancelled'),
            bookingHistory: mappedBookings,
            savedTravellers,
            wallet: { balance: this.#money(20, 'EUR') },
            rewards: { points: 1240 },
            coupons: [
                { code: 'AGTRIP25', description: 'Save on your next booking', expiresAt: '2026-12-31' }
            ],
            profile: {
                name: savedTravellers[0]?.name || 'Pratham Raj',
                email: 'prathamraj@example.com',
                phone: '+91 98765 43210'
            }
        };
    }

    #buildBookingDetailsResponse(booking, flightData) {
        return {
            bookingId: `booking_${booking.id}`,
            status: 'draft',
            rawBooking: booking,
            tripSummary: {
                airline: 'IndiGo',
                flightNumber: flightData.flightNumber,
                route: `${flightData.departureAirportId} -> ${flightData.arrivalAirportId}`,
                departureDate: this.#date(flightData.departureTime),
                departureTime: this.#time(flightData.departureTime),
                arrivalTime: this.#time(flightData.arrivalTime),
                duration: this.#duration(flightData.departureTime, flightData.arrivalTime)
            },
            fareSummary: {
                baseFare: this.#money(booking.totalCost, 'INR'),
                taxes: this.#money(Math.round(booking.totalCost * 0.08), 'INR'),
                discount: this.#money(0, 'INR'),
                total: this.#money(Math.round(booking.totalCost * 1.08), 'INR')
            }
        };
    }

    #buildSeatLeg(legId, route) {
        const columns = ['A', 'B', 'C', 'D', 'E', 'F'];
        const seats = [];
        for (let row = 1; row <= 11; row += 1) {
            columns.forEach((column) => {
                seats.push({
                    seatNumber: `${row}${column}`,
                    type: row <= 1 ? 'extra_legroom' : row <= 5 ? 'free' : row <= 8 ? 'preferred' : 'unavailable',
                    price: this.#money(row <= 1 ? 12 : row <= 5 ? 0 : row <= 8 ? 8 : 0, 'EUR'),
                    available: row <= 8
                });
            });
        }
        return { legId, route, columns, seats };
    }

    #tripSummary() {
        return {
            airline: 'IndiGo',
            flightNumber: '6E 322',
            route: 'New Delhi (DEL) -> Bengaluru (BLR)',
            date: '2026-06-21',
            time: '10:30 AM - 12:40 PM',
            duration: '2h 10m',
            stops: 'Non-stop'
        };
    }

    #bookingReference(bookingId) {
        return `AG${String(bookingId).replace('booking_', '').padStart(6, '0')}`;
    }

    #normalizeBookingId(bookingId) {
        return String(bookingId).replace('booking_', '');
    }

    async #getSavedPassengerData(bookingId) {
        try {
            const { passengers, contact } = await this.bookingRepository.getPassengers(bookingId);
            const firstPassenger = passengers?.[0];
            return {
                contact,
                traveller: {
                    name: firstPassenger ? `${firstPassenger.firstName} ${firstPassenger.lastName}` : 'Pratham Raj',
                    type: this.#titleCase(firstPassenger?.type || 'Adult'),
                    gender: this.#titleCase(firstPassenger?.gender || 'Male'),
                    age: firstPassenger?.age || 28
                }
            };
        } catch (error) {
            return {
                contact: null,
                traveller: {
                    name: 'Pratham Raj',
                    type: 'Adult',
                    gender: 'Male',
                    age: 28
                }
            };
        }
    }

    async #getSavedSelectionSummary(bookingId) {
        try {
            const selections = await this.bookingRepository.getSelections(bookingId);
            const seat = selections.find((selection) => selection.seatNumber)?.seatNumber;
            const mealId = selections.find((selection) => selection.mealId)?.mealId;
            const baggage = selections.find((selection) => selection.addOnId === 'bag_15kg_extra') ? '30 Kg' : '15 Kg';
            return {
                seat: seat || '17F',
                meal: mealId ? this.#labelFromId(mealId) : 'Veg Meal',
                baggage
            };
        } catch (error) {
            return {
                seat: '17F',
                meal: 'Veg Meal',
                baggage: '15 Kg'
            };
        }
    }

    async #ensureTicket(bookingId) {
        try {
            const existingTicket = await this.bookingRepository.getTicket(bookingId);
            if (existingTicket) return existingTicket;
            const bookingReference = this.#bookingReference(bookingId);
            return this.bookingRepository.upsertTicket({
                bookingId,
                bookingReference,
                pnr: `AG${String(bookingId).padStart(4, '0')}`,
                barcode: `${bookingReference}-DEL-BLR-17F`
            });
        } catch (error) {
            return null;
        }
    }

    async #publishBookingConfirmation(bookingId, ticket) {
        try {
            const savedPassengerData = await this.#getSavedPassengerData(bookingId);
            const channel = await createChannel();
            const payload = {
                service: 'CREATE_TICKET',
                data: {
                    subject: `AirGo booking confirmed ${ticket?.bookingReference || this.#bookingReference(bookingId)}`,
                    content: `Your AirGo booking ${ticket?.bookingReference || this.#bookingReference(bookingId)} is confirmed.`,
                    recepientEmail: savedPassengerData.contact?.email || 'prathamraj@example.com',
                    notificationTime: new Date().toISOString()
                }
            };
            await publishMessage(channel, REMINDER_BINDING_KEY, JSON.stringify(payload));
        } catch (error) {
            console.log('Skipping reminder publish for booking confirmation', error.message);
        }
    }

    #formatPhone(contact) {
        if (!contact) return '+91 98765 43210';
        return `${contact.phoneCountryCode || '+91'} ${contact.phone || '9876543210'}`;
    }

    #titleCase(value) {
        const stringValue = String(value || '');
        return stringValue.charAt(0).toUpperCase() + stringValue.slice(1);
    }

    #labelFromId(value) {
        return String(value)
            .replace(/^meal_/, '')
            .split('_')
            .map((part) => this.#titleCase(part))
            .join(' ');
    }

    #money(amount, currency) {
        const numericAmount = Number(amount || 0);
        return {
            amount: numericAmount,
            currency,
            formatted: `${currency} ${numericAmount.toLocaleString('en-IN')}`
        };
    }

    #date(value) {
        return new Date(value).toISOString().slice(0, 10);
    }

    #time(value) {
        return new Date(value).toLocaleTimeString('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
            timeZone: 'Asia/Kolkata'
        });
    }

    #duration(start, end) {
        const minutes = Math.max(1, Math.round((new Date(end) - new Date(start)) / 60000));
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        return `${hours}h ${remainingMinutes}m`;
    }
}

module.exports = BookingService;
