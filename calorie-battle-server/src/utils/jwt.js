const jwt = require('jsonwebtoken');
const jwtConfig = require('../config/jwt');

const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, jwtConfig.secret, {
    expiresIn: jwtConfig.expiresIn,
  });

  const refreshToken = jwt.sign(payload, jwtConfig.refreshSecret, {
    expiresIn: jwtConfig.refreshExpiresIn,
  });

  return { accessToken, refreshToken };
};

const verifyAccessToken = (token) => {
  return jwt.verify(token, jwtConfig.secret);
};

const verifyRefreshToken = (token) => {
  return jwt.verify(token, jwtConfig.refreshSecret);
};

module.exports = {
  generateTokens,
  verifyAccessToken,
  verifyRefreshToken,
};
