'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BookingContact extends Model {
    static associate(models) {
      this.belongsTo(models.Booking, { foreignKey: 'bookingId' });
    }
  }

  BookingContact.init({
    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    phoneCountryCode: {
      type: DataTypes.STRING,
      allowNull: false,
      defaultValue: '+91'
    },
    phone: {
      type: DataTypes.STRING,
      allowNull: false
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        isEmail: true
      }
    }
  }, {
    sequelize,
    modelName: 'BookingContact',
  });

  return BookingContact;
};
