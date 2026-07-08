'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BookingTicket extends Model {
    static associate(models) {
      this.belongsTo(models.Booking, { foreignKey: 'bookingId' });
    }
  }

  BookingTicket.init({
    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    bookingReference: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    pnr: {
      type: DataTypes.STRING,
      allowNull: false
    },
    barcode: {
      type: DataTypes.STRING,
      allowNull: false
    }
  }, {
    sequelize,
    modelName: 'BookingTicket',
  });

  return BookingTicket;
};
