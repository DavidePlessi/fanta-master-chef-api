const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const auth = require('../middleware/auth');
const gameSession = require('../middleware/gameSession');
const {check, validationResult} = require('express-validator');
const {errorMessages} = require('../config/messages');
const _ = require('lodash');

const FantaBrigade = require('../models/FantaBrigade');
const Participant = require('../models/Participant');
const Deployment = require('../models/Deployment');
const User = require('../models/User');
const Episode = require('../models/Episode');

// @route   POST api/fantaBrigades
// @desc    Create or update a fantaBrigade
// @access  Private
router.post(
  '/',
  [
    auth,
    gameSession,
    [
      check('participants', errorMessages.ParticipantsIsRequired).not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({errorCodes: errors.array().map(x => x.msg)});
    }

    let {
      participants
    } = req.body

    participants = participants.map(x => mongoose.Types.ObjectId(x));

    const fantaBrigadeFields = {};
    fantaBrigadeFields.user = req.user.id;
    fantaBrigadeFields.gameSession = req.currentGameSessionId;
    if (participants) fantaBrigadeFields.participants = participants

    try {
      let fantaBrigade = await FantaBrigade.findOne(
        {
          user: req.user.id,
          gameSession: req.currentGameSessionId
        });

      if (fantaBrigade) {
        fantaBrigade = await FantaBrigade.findOneAndUpdate(
          {user: req.user.id, gameSession: req.currentGameSessionId},
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
  [auth, gameSession],
  async (req, res) => {
    try {
      const fantaBrigades = (await FantaBrigade.find({gameSession: req.currentGameSessionId}));
      for (let fantaBrigade of fantaBrigades) {
        await populateParticipant(fantaBrigade);
        await populateWithResults(fantaBrigade);
        await populateName(fantaBrigade);
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
  [auth, gameSession],
  async (req, res) => {
    try {
      const fantaBrigade = await FantaBrigade.findOne({user: req.user.id, gameSession: req.currentGameSessionId});

      await populateParticipant(fantaBrigade);
      await populateWithResults(fantaBrigade);
      await populateName(fantaBrigade);

      res.json(fantaBrigade);
    } catch (e) {
      console.error(e.message);
      res.status(500).json({errorCodes: [errorMessages.GenericError]});
    }
  }
)

async function populateParticipant(fantaBrigade) {
  const participants = [];
  for (let participantId of fantaBrigade.participants) {
    const participant = await Participant.findById(participantId);
    participants.push(participant);
  }
  fantaBrigade.participants = participants;
}

async function populateDeploymentResults(fantaBrigade) {
  const deployments = await Deployment.find({user: fantaBrigade.user});
  const resultPoint = _.reduce(deployments, function (sum, dep) {
    const resultPoint = !!dep.results
      ? dep.results.resultsPoint || 0
      : 0;
    return sum + resultPoint;
  }, 0);
  fantaBrigade._doc.resultsPoint = resultPoint;
}

async function populateName(fantaBrigade) {
  const user = await User.findById(fantaBrigade.user);
  fantaBrigade._doc.name = user.name;
}

async function populateWithResults(fantaBrigade) {
  let deployments = await Deployment.find({user: fantaBrigade.user});
  for(let deployment of deployments){
    await populateDeploymentWithEpisode(deployment);
  }
  const resultsList = _.flatten(deployments.map(x => ({...x.results, episodeNumber: x.episode.number})))
    .filter(x => !!x.results && x.results.length > 0);
  const resultsPoint = _.sumBy(resultsList, 'resultsPoint');
  fantaBrigade._doc.results = {
    results: _.orderBy(resultsList, ['episodeNumber'], ['desc']),
    resultsPoint
  }
}
async function populateDeploymentWithEpisode(deployment) {
  deployment.episode = await Episode.findById(deployment.episode);
}

module.exports = router;