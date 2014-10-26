"use strict";

module.exports = function(sequelize, DataTypes) {
  var Food = sequelize.define("Food", {
    name: DataTypes.STRING,
    foodId: DataTypes.TEXT,
    imageUrl: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        models.Food.hasMany(models.User);
      }
    }
  });

  return Food;
};


