const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { check, validationResult } = require('express-validator');
const {errorMessages, infoMessages} = require('../config/messages');

const Participant = require('../models/Participant');

// @route   POST api/participants
// @desc    Create or update a participant
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('name', errorMessages.NameIsRequired).not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      return res.status(400).json({ errorCodes: errors.array().map(x => x.msg)  });
    }
    const {
      id,
      name,
      lastName,
      description,
      eliminated,
      editionNumber,
      imgName
    } = req.body;

    const participantFields = {};

    if(name) participantFields.name = name;
    if(lastName) participantFields.lastName = lastName;
    if(description) participantFields.description = description;
    if(editionNumber) participantFields.editionNumber = editionNumber;
    if(eliminated !== undefined && eliminated !== null) participantFields.eliminated = eliminated;
    if(imgName) participantFields.imgName = imgName;

    try {
      let participant = await Participant.findById(id);

      if(participant) {
        participant = await Participant.findByIdAndUpdate(
          id,
          {$set: participantFields},
          {new: true}
          )
      } else {
        participant = new Participant(participantFields);
        await participant.save();
      }

      res.json(participant);
    } catch (e) {
      console.error(e.message);
      res.status(500).json({errorCodes: [errorMessages.GenericError]});
    }
  }
);

// @route   GET api/participants
// @desc    Get all participants
// @access  Private
router.get('/', auth, async(req, res) => {
  try {
    const participants = await Participant.find().sort({lastName: -1, name: -1});
    res.json(participants)
  } catch (e) {
    console.error(e.message);
    res.status(500).json({errorCodes: [errorMessages.GenericError]});
  }
});

// @route   GET api/participants/:id
// @desc    Get participant by id
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if(!participant){
      return res.status(400).json({errorCodes: [errorMessages.NotFound]});
    }
    res.json(participant);
  } catch (e) {
    console.error(e.message);
    if(err.kind == 'ObjectId') {
      return res.status(400).json({errorCodes: [errorMessages.NotFound]});
    }
    res.status(500).json({errorCodes: [errorMessages.GenericError]});
  }
});

// @route   DELETE api/participants/:id
// @desc    Delete participant by id
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const participant = await Participant.findById(req.params.id);
    if(!participant) {
      return res.status(404).json({errorCodes: [errorMessages.NotFound]});
    }
    await participant.remove();
    res.json({msg: infoMessages.CorrectlyRemoved});
  } catch (e) {
    console.error(e.message);
    if(err.kind == 'ObjectId') {
      return res.status(400).json({errorCodes: [errorMessages.NotFound]});
    }
    res.status(500).json({errorCodes: [errorMessages.GenericError]});
  }
});

module.exports = router;