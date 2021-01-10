const jwt = require('jsonwebtoken');
const config = require('config');

module.exports = function(req, res, next) {
  // Get token from header
  const token = req.header('x-auth-token');

  // Check if no token
  if (!token) {
    return res.status(401).json({ errorCodes: ['No token, authorization denied!'] });
  }

  // Verify the token
  try {
    const decoded = jwt.verify(token, process.env.jwtSecret || config.get('jwtSecret'));

    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ errorCodes: ['Token is not valid'] });
  }
};
