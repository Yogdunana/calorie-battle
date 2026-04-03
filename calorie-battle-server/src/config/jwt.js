const config = require('./index');

module.exports = {
  secret: config.jwt.secret,
  refreshSecret: config.jwt.refreshSecret,
  expiresIn: config.jwt.expiresIn,
  refreshExpiresIn: config.jwt.refreshExpiresIn,
};
