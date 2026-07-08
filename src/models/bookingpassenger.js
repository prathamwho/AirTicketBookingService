'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BookingPassenger extends Model {
    static associate(models) {
      this.belongsTo(models.Booking, { foreignKey: 'bookingId' });
    }
  }

  BookingPassenger.init({
    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    passengerRef: DataTypes.STRING,
    type: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'adult'
    },
    firstName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    lastName: {
      type: DataTypes.STRING,
      allowNull: false
    },
    gender: DataTypes.STRING,
    age: DataTypes.INTEGER,
    frequentFlyerNumber: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'BookingPassenger',
  });

  return BookingPassenger;
};
