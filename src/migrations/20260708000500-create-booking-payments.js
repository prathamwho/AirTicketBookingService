'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('BookingPayments', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      bookingId: { type: Sequelize.INTEGER, allowNull: false },
      paymentIntentId: { type: Sequelize.STRING, allowNull: false, unique: true },
      amount: { type: Sequelize.FLOAT, allowNull: false },
      currency: { type: Sequelize.STRING, allowNull: false, defaultValue: 'EUR' },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'requires_payment' },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('BookingPayments');
  }
};
