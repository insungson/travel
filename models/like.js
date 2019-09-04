module.exports = (sequelize,DataTypes) => (
    sequelize.define('like',{
        like:{
            type: DataTypes.STRING(30),
            allowNull: true,
            unique: false,
        },
    },{
      timestamps: true,
      paranoid: true,
      charset: 'utf8',
      collate: 'utf8_general_ci',
    })
);