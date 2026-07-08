'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('BookingPassengers', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      bookingId: { type: Sequelize.INTEGER, allowNull: false },
      passengerRef: { type: Sequelize.STRING },
      type: { type: Sequelize.STRING, allowNull: false, defaultValue: 'adult' },
      firstName: { type: Sequelize.STRING, allowNull: false },
      lastName: { type: Sequelize.STRING, allowNull: false },
      gender: { type: Sequelize.STRING },
      age: { type: Sequelize.INTEGER },
      frequentFlyerNumber: { type: Sequelize.STRING },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('BookingPassengers');
  }
};
