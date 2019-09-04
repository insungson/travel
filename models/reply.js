module.exports = (sequelize, DataTypes) => (
    sequelize.define('reply', {
      reply: {
        type: DataTypes.STRING(100),
        allowNull: true,
        unique: false,
      },
    }, {
      timestamps: true,
      paranoid: true,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    })
  );