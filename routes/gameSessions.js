const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {errorMessages} = require('../config/messages');
const {check, validationResult} = require('express-validator');
const mongoose = require('mongoose');

const GameSession = require('../models/GameSession');


// @route   POST api/gameSessions
// @desc    Create or update a game session
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('name', errorMessages.NameIsRequired).not().isEmpty(),
      check('admins', errorMessages.AdminsIsRequired).isArray().not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({errorCodes: errors.array().map(x => x.msg)})
    }

    const {
      id,
      name,
      admins
    } = req.body;

    if(admins.length <= 0)
      return res.status(400).json({errorCodes: [errorMessages.AdminsIsRequired]});

    const gameSessionFields = {
      name,
      admins: admins.map(x => mongoose.Types.ObjectId(x))
    };

    try {
      let gameSession = await GameSession.findById(id);
      if(gameSession) {
        gameSession = GameSession.findByIdAndUpdate(
          id,
          {$set: gameSessionFields},
          {new: true}
        )
      } else {
        gameSession = new GameSession(gameSessionFields);
        await gameSession.save();
      }

      res.json(gameSession)
    } catch (e) {
      console.error(e.message);
      res.status(500).json({errorCodes: [errorMessages.GenericError]});
    }
  }
);

// @route   GET api/gameSessions
// @desc    Get all gameSessions
// @access  Private
router.get('/', auth, async(req, res) => {
  try {
    const gameSessions = await GameSession.find({
      '_id': { $in: req.user.gameSessions.map(x => mongoose.Types.ObjectId(x))}
    });
    res.json(gameSessions)
  } catch (e) {
    console.error(e.message);
    res.status(500).json({errorCodes: [errorMessages.GenericError]});
  }
});

// @route   GET api/gameSessions/:id
// @desc    Get gameSession by id
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const gameSession = await GameSession.findById(req.params.id);
    if(!gameSession){
      return res.status(400).json({errorCodes: [errorMessages.NotFound]});
    }
    res.json(gameSession);
  } catch (e) {
    console.error(e.message);
    if(err.kind == 'ObjectId') {
      return res.status(400).json({errorCodes: [errorMessages.NotFound]});
    }
    res.status(500).json({errorCodes: [errorMessages.GenericError]});
  }
});

//TODO: aggiungere API di caricamento utenti a sessione di gioco

module.exports = router;
