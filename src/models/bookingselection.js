'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BookingSelection extends Model {
    static associate(models) {
      this.belongsTo(models.Booking, { foreignKey: 'bookingId' });
    }
  }

  BookingSelection.init({
    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: false
    },
    legId: {
      type: DataTypes.STRING,
      allowNull: false
    },
    seatNumber: DataTypes.STRING,
    mealId: DataTypes.STRING,
    addOnId: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'BookingSelection',
  });

  return BookingSelection;
};
