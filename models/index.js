const Sequelize = require('sequelize');
const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const db = {};

const sequelize = new Sequelize(
  config.database, config.username, config.password, config,
);

db.sequelize = sequelize;
db.Sequelize = Sequelize;
db.User = require('./user')(sequelize, Sequelize);
db.Post = require('./post')(sequelize, Sequelize);
db.Placetag = require('./placetag')(sequelize, Sequelize);
db.Reply = require('./reply')(sequelize, Sequelize);
db.Like = require('./like')(sequelize,Sequelize);

db.User.hasMany(db.Post);
db.Post.belongsTo(db.User);
db.Post.belongsToMany(db.Placetag, {through:'PostPlacetag'});
db.Placetag.belongsToMany(db.Post, {through:'PostPlacetag'});
db.Post.hasMany(db.Reply);
db.Reply.belongsTo(db.Post);
db.User.hasMany(db.Reply);
db.Reply.belongsTo(db.User);
db.Post.hasMany(db.Like);
db.Like.belongsTo(db.Post);
db.User.hasMany(db.Like);
db.Like.belongsTo(db.User);

module.exports = db;