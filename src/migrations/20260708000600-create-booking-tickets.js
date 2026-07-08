'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('BookingTickets', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      bookingId: { type: Sequelize.INTEGER, allowNull: false, unique: true },
      bookingReference: { type: Sequelize.STRING, allowNull: false, unique: true },
      pnr: { type: Sequelize.STRING, allowNull: false },
      barcode: { type: Sequelize.STRING, allowNull: false },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('BookingTickets');
  }
};
