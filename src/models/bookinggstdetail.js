'use strict';
const { Model } = require('sequelize');

module.exports = (sequelize, DataTypes) => {
  class BookingGSTDetail extends Model {
    static associate(models) {
      this.belongsTo(models.Booking, { foreignKey: 'bookingId' });
    }
  }

  BookingGSTDetail.init({
    bookingId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true
    },
    enabled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
    companyName: DataTypes.STRING,
    gstNumber: DataTypes.STRING,
    state: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'BookingGSTDetail',
  });

  return BookingGSTDetail;
};
