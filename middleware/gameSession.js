const {errorMessages} = require('../config/messages')

module.exports = function (req, res, next) {
  const gameSessionId = req.header('game-session-id');

  if (!gameSessionId || req.user.gameSessions.indexOf(gameSessionId) === -1) {
    return res.status(401).json({errorCodes: [errorMessages.GameSessionIdNotValid]});
  }

  req.currentGameSessionId = gameSessionId;
  next();
}