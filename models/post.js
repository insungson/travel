module.exports = (sequelize, DataTypes) => (
    sequelize.define('post', {
        placeId: {
            type: DataTypes.STRING(40),
            allowNull: true,
        },
        name: {
            type: DataTypes.STRING(40),
            allowNull: false,
        },
        lat: {
            type: DataTypes.FLOAT(10, 6),
            allowNull: false,
        },
        lng: {
            type: DataTypes.FLOAT(10, 6),
            allowNull: false,
        },
        content: {
            type: DataTypes.STRING(140),
            allowNull: true,
        },
        rate: {
            type: DataTypes.INTEGER,
            allowNull: true,
        },
        img: {
            type: DataTypes.STRING(200),
            allowNull: true,
        },
        like:{
            type: DataTypes.INTEGER,
            allowNull: true,
        }
    }, {
            timestamps: true,
            paranoid: true,
            charset: 'utf8',
            collate: 'utf8_general_ci',
        })
);
