'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('BookingGSTDetails', {
      id: { allowNull: false, autoIncrement: true, primaryKey: true, type: Sequelize.INTEGER },
      bookingId: { type: Sequelize.INTEGER, allowNull: false, unique: true },
      enabled: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      companyName: { type: Sequelize.STRING },
      gstNumber: { type: Sequelize.STRING },
      state: { type: Sequelize.STRING },
      createdAt: { allowNull: false, type: Sequelize.DATE },
      updatedAt: { allowNull: false, type: Sequelize.DATE }
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('BookingGSTDetails');
  }
};
