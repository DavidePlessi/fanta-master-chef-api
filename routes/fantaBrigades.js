const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middleware/auth');
const {check, validationResult} = require('express-validator');
const {errorMessages} = require('../config/messages');

const FantaBrigade = require('../models/FantaBrigade');
const Participant = require('../models/Participant');

// @route   POST api/fantaBrigades
// @desc    Create or update a fantaBrigade
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('participants', errorMessages.ParticipantsIsRequired).not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errorCodes: errors.array().map(x => x.msg)  });
    }

    let {
      participants
    } = req.body

    participants = participants.map(x => mongoose.Types.ObjectId(x));

    const fantaBrigadeFields = {};
    fantaBrigadeFields.user = req.user.id;
    if(participants) fantaBrigadeFields.participants = participants

    try {
      let fantaBrigade = await FantaBrigade.findOne({user: req.user.id});

      if(fantaBrigade) {
        fantaBrigade = await FantaBrigade.findOneAndUpdate(
          {user: req.user.id},
          {$set: fantaBrigadeFields},
          {new: true}
        );
      } else {
          fantaBrigade = new FantaBrigade(fantaBrigadeFields);
          await fantaBrigade.save()
      }

      res.json(fantaBrigade);
    } catch (e) {
      console.error(e.message);
      res.status(500).json({errorCodes: [errorMessages.GenericError]});
    }
  }
);

// @route   GET api/fantaBrigades
// @desc    Get all fantaBrigades
// @access  Private
router.get(
  '/',
  auth,
  async (req, res) => {
    try {
      const fantaBrigades = (await FantaBrigade.find({}));
      for(let fantaBrigade of fantaBrigades){
        await populateParticipant(fantaBrigade);
      }
      res.json(fantaBrigades);
    } catch (e) {
      console.error(e.message);
      res.status(500).json({errorCodes: [errorMessages.GenericError]});
    }
  }
)

// @route   GET api/fantaBrigades/my-brigade
// @desc    Get all fantaBrigades
// @access  Private
router.get(
  '/my-brigade',
  auth,
  async (req, res) => {
    try {
      const fantaBrigade = await FantaBrigade.findOne({user: req.user.id});

      await populateParticipant(fantaBrigade);

      res.json(fantaBrigade);
    } catch (e) {
      console.error(e.message);
      res.status(500).json({errorCodes: [errorMessages.GenericError]});
    }
  }
)

async function populateParticipant(fantaBrigade) {
  const participants = [];
  for(let participantId of fantaBrigade.participants){
    const participant = await Participant.findById(participantId);
    participants.push(participant);
  }
  fantaBrigade.participants = participants;
}

module.exports = router;