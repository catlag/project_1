"use strict";

module.exports = function(sequelize, DataTypes) {
  var FoodsUser = sequelize.define("FoodsUser", {
    FoodId: DataTypes.INTEGER,
    UserId: DataTypes.INTEGER
  }, {
    classMethods: {
      associate: function(models) {
        models.FoodsUser.belongsTo(models.User);
        models.FoodsUser.belongsTo(models.Food);
        // associations can be defined here
      }
    }
  });

  return FoodsUser;
};
