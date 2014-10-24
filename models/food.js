"use strict";

module.exports = function(sequelize, DataTypes) {
  var Food = sequelize.define("Food", {
    foodName: DataTypes.STRING,
    foodId: DataTypes.STRING
  }, {
    classMethods: {
      associate: function(models) {
        // associations can be defined here
      }
    }
  });

  return Food;
};
