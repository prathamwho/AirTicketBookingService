'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BookingPayment extends Model {
    static associate(models) {
      this.belongsTo(models.Booking, { foreignKey: 'bookingId' });
    }
  }

  BookingPayment.init({
    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    paymentIntentId: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true
    },
    amount: {
      type: DataTypes.FLOAT,
      allowNull: false
    },
    currency: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'EUR'
    },
    status: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: 'requires_payment'
    }
  }, {
    sequelize,
    modelName: 'BookingPayment',
  });

  return BookingPayment;
};
