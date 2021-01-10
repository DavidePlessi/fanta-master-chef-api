const moment = require("moment");
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {check, validationResult} = require('express-validator');
const {errorMessages, infoMessages} = require('../config/messages');

const Episode = require('../models/Episode');
const Participant = require('../models/Participant');

// @route   POST api/episodes
// @desc    Create or update a episode
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('number', errorMessages.NumberIsRequired).not().isEmpty(),
      check('editionNumber', errorMessages.EditionNumberIsRequired).not().isEmpty(),
      check('isOutside', errorMessages.EditionNumberIsRequired).not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errorCodes: errors.array().map(x => x.msg)  });
    }

    const {
      number,
      editionNumber,
      isOutside,
      date,
      description
    } = req.body

    const episodeFields = {};

    if (number) episodeFields.number = number;
    if (editionNumber) episodeFields.editionNumber = editionNumber;
    if (isOutside !== undefined && isOutside !== null) episodeFields.isOutside = isOutside;
    if (date) episodeFields.date = moment(date);
    if (description) episodeFields.description = description;

    try {
      let episode = await Episode.findOne({number, editionNumber});

      if(episode){
        episode = await Episode.findOneAndUpdate(
          {number, editionNumber},
          {$set: episodeFields},
          {new: true}
        );
      } else {
        episode  = new Episode(episodeFields);
        await episode.save()
      }

      res.json(episode);
    } catch (e) {
      console.error(e.message);
      res.status(500).json({errorCodes: [errorMessages.GenericError]});
    }
  }
);

// @route   GET api/episodes
// @desc    Get all episodes
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const episodes = await Episode.find().sort({editionNumber: -1, number: -1});
    res.json(episodes);
  } catch (e) {
    console.error(e.message);
    res.status(500).json({errorCodes: [errorMessages.GenericError]});
  }
})

// @route   GET api/episodes/:editionNumber/:number
// @desc    Get episode by id
// @access  Private
router.get('/:editionNumber/:number', auth, async (req, res) => {
  try {
    const {
      number,
      editionNumber
    } = req.params

    const episode = await Episode.findOne({number, editionNumber});
    if(!episode){
      return res.status(404).json({errorCodes: [errorMessages.NotFound]})
    }
    res.json(episode);
  } catch (e) {
    console.error(e.message);
    res.status(500).json({errorCodes: [errorMessages.GenericError]});
  }
});


// @route   POST api/episodes/loadResult
// @desc    Get participant by id
// @access  Private
router.post(
  '/loadResult',
  [
    auth,
    [
      check('number', errorMessages.NumberIsRequired).not().isEmpty(),
      check('editionNumber', errorMessages.EditionNumberIsRequired).not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      return res.status(400).json({ errorCodes: errors.array().map(x => x.msg)  });
    }
    const {
      editionNumber,
      number,
      mysteryBoxPodium,
      mysteryBoxWorst,
      inventionTestPodium,
      inventionTestWorst,
      redBrigade,
      blueBrigade,
      redBrigadeWins,
      pressureTest,
      eliminated
    } = req.body

    const episodeFields = {};

    if(mysteryBoxPodium) episodeFields.mysteryBoxPodium = mysteryBoxPodium;
    if(mysteryBoxWorst) episodeFields.mysteryBoxWorst = mysteryBoxWorst;
    if(inventionTestPodium) episodeFields.inventionTestPodium = inventionTestPodium;
    if(inventionTestWorst) episodeFields.inventionTestWorst = inventionTestWorst;
    if(redBrigade) episodeFields.redBrigade = redBrigade;
    if(blueBrigade) episodeFields.blueBrigade = blueBrigade;
    if(redBrigadeWins) episodeFields.redBrigadeWins = redBrigadeWins;
    if(pressureTest) episodeFields.pressureTest = pressureTest;
    if(eliminated) episodeFields.eliminated = eliminated;

    try {
      let episode = await Episode.findOne({number, editionNumber});
      if(!episode){
        return res.status(404).json({errorCodes: [errorMessages.NotFound]})
      }

      episode = await Episode.findOneAndUpdate(
        {number, editionNumber},
        {$set: episodeFields},
        {new: true}
      )

      res.json(episode);
    } catch (e) {
      console.error(e.message);
      res.status(500).json({errorCodes: [errorMessages.GenericError]});
    }
  }
);

module.exports = router;