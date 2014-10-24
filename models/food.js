"use strict";

module.exports = function(sequelize, DataTypes) {
  var Food = sequelize.define("Food", {
    name: DataTypes.STRING,
    foodId: DataTypes.TEXT,
    imageUrl: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });

  return Food;
};
