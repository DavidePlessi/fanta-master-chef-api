const moment = require("moment");
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {check, validationResult} = require('express-validator');
const {errorMessages, infoMessages} = require('../config/messages');
const _ = require('lodash');
const mongoose = require('mongoose');

const Episode = require('../models/Episode');
const Deployment = require('../models/Deployment');
const Participant = require('../models/Participant');
const User = require('../models/User');

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
      return res.status(400).json({errorCodes: errors.array().map(x => x.msg)});
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

      if (episode) {
        episode = await Episode.findOneAndUpdate(
          {number, editionNumber},
          {$set: episodeFields},
          {new: true}
        );
      } else {
        episode = new Episode(episodeFields);
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
    if (!episode) {
      return res.status(404).json({errorCodes: [errorMessages.NotFound]})
    }
    res.json(episode);
  } catch (e) {
    console.error(e.message);
    res.status(500).json({errorCodes: [errorMessages.GenericError]});
  }
});

// @route   GET api/episodes/with-deployment/:editionNumber/:number
// @desc    Get episode by edition number and episode number
// @access  Private
router.get('/with-deployment/:editionNumber/:number',
  auth,
  async (req, res) => {
    try {
      const {
        number,
        editionNumber
      } = req.params

      const episode = await Episode.findOne({number, editionNumber});
      if (!episode) {
        return res.status(404).json({errorCodes: [errorMessages.NotFound]})
      }
      await populateDeployments(episode, true, true);
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
    if (!errors.isEmpty()) {
      return res.status(400).json({errorCodes: errors.array().map(x => x.msg)});
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

    if (mysteryBoxPodium) episodeFields.mysteryBoxPodium = mysteryBoxPodium;
    if (mysteryBoxWorst) episodeFields.mysteryBoxWorst = mysteryBoxWorst;
    if (inventionTestPodium) episodeFields.inventionTestPodium = inventionTestPodium;
    if (inventionTestWorst) episodeFields.inventionTestWorst = inventionTestWorst;
    if (redBrigade) episodeFields.redBrigade = redBrigade;
    if (blueBrigade) episodeFields.blueBrigade = blueBrigade;
    if (redBrigadeWins) episodeFields.redBrigadeWins = redBrigadeWins;
    if (pressureTest) episodeFields.pressureTest = pressureTest;
    if (eliminated) episodeFields.eliminated = eliminated;

    try {
      let episode = await Episode.findOne({number, editionNumber});
      if (!episode) {
        return res.status(404).json({errorCodes: [errorMessages.NotFound]})
      }

      episode = await Episode.findOneAndUpdate(
        {number, editionNumber},
        {$set: episodeFields},
        {new: true}
      )

      const deployments = await Deployment.find({episode: episode._id});
      const deploymentsWithResult = [];
      for(let deployment of deployments) {
        deploymentsWithResult.push(await Deployment.findByIdAndUpdate(
          deployment._id,
          {$set: {results: await calculateDeploymentResults(deployment, episode)}},
          {new:  true}
        ));
      }
      episode._doc.deployments = deploymentsWithResult;
      res.json(episode);
    } catch (e) {
      console.error(e.message);
      res.status(500).json({errorCodes: [errorMessages.GenericError]});
    }
  }
);

async function populateDeployments(episode, populateDeploymentWithUser, populateDeploymentWithParticipants) {
  const deployments = await Deployment.find({episode: episode._id});
  if(!deployments) return false;

  if(populateDeploymentWithUser){
    for(let deploymentIndex in deployments){
      deployments[deploymentIndex].user = await User.findById(deployments[deploymentIndex].user);
    }
  }
  if(populateDeploymentWithParticipants){
    for(let deploymentIndex in deployments){
      const participants = [];
      for(let participantId of deployments[deploymentIndex].participants){
        const participant = await Participant.findById(participantId);
        participants.push(participant);
      }
      deployments[deploymentIndex].participants = participants;
    }
  }

  episode._doc.deployments = [...deployments];
}

async function calculateDeploymentResults(deployment, episode) {
  //TODO: calcolare persona non schierata prima della semifinale
  const deploymentDoc = deployment._doc;
  const episodeDoc = episode._doc;

  const results = [];
  let resultsPoint = 0;

  //Persona tra i primi tre nella mystery box
  const participantsInMysteryBoxPodium = _.intersectionWith(
    deploymentDoc.participants,
    episodeDoc.mysteryBoxPodium,
    _.isEqual
  );
  for(let participantInMysteryBoxPodium of participantsInMysteryBoxPodium){
    results.push({
      type: 'ParticipantInMysteryBoxPodium',
      participant: participantInMysteryBoxPodium,
      value: 5
    });
    resultsPoint += 5
  }

  //Persona prima nella mystery box
  const participantWinnerOfMysteryBox = episodeDoc.mysteryBoxPodium.length >= 1
    ? deploymentDoc.participants.map(x => x.toString()).find(x => x === episodeDoc.mysteryBoxPodium[0].toString())
    : null;
  if(!!participantWinnerOfMysteryBox) {
    results.push({
      type: 'ParticipantWinnerOfMysteryBox',
      participant: mongoose.Types.ObjectId(participantWinnerOfMysteryBox),
      value: 10
    });
    resultsPoint += 10
  }

  //Persona prima nell'invention test
  const participantWinnerOfInventionTest = episodeDoc.inventionTestPodium.length >= 1
    ? deploymentDoc.participants.map(x => x.toString()).find(x => x === episodeDoc.inventionTestPodium[0].toString())
    : null;
  if(!!participantWinnerOfInventionTest){
    results.push({
      type: 'ParticipantWinnerOfInventionTest',
      participant: mongoose.Types.ObjectId(participantWinnerOfMysteryBox),
      value: 10
    });
    resultsPoint += 10
  }

  //Persona vince sia invention test che mystery box
  if(!!participantWinnerOfMysteryBox &&
    !!participantWinnerOfInventionTest &&
    participantWinnerOfMysteryBox === participantWinnerOfInventionTest){
    results.push({
      type: 'ParticipantWinnerOfMysteryBoxAndInventionTest',
      participant:  mongoose.Types.ObjectId(participantWinnerOfMysteryBox),
      value: 20
    });
    resultsPoint += 20;
  }

  //Persona tra i tre peggiori dell'invention test
  const participantsInInventionTestWorst = _.intersectionWith(
    deployment.participants,
    episode.inventionTestWorst,
    _.isEqual
  );
  for(let participantInInventionTestWorst of participantsInInventionTestWorst){
    results.push({
      type: 'ParticipantInInventionTestWorst',
      participant: participantInInventionTestWorst,
      value: -5
    });
    resultsPoint -= 5
  }

  // Punteggio esterna
  if(episode.isOutside &&
    episode.redBrigade &&
    episode.redBrigade.length > 0 &&
    episode.blueBrigade &&
    episode.blueBrigade.length > 0
  ) {
    //Persona che non va in esterna
    for(let deploymentParticipant of deploymentDoc.participants.map(x => x.toString())){
      const deploymentParticipantObj = await Participant.findById(mongoose.Types.ObjectId(deploymentParticipant));
      if(!episodeDoc.redBrigade.map(x => x.toString()).includes(deploymentParticipant) &&
        !episodeDoc.blueBrigade.map(x => x.toString()).includes(deploymentParticipant) &&
        (!deploymentParticipantObj.eliminated ||
          (deploymentParticipantObj.eliminated && episodeDoc.eliminated.map(x => x.toString()).includes(deploymentParticipant)))
      ){
        results.push({
          type: 'ParticipantNotInABrigade',
          participant: deploymentParticipant,
          value: -10
        });
        resultsPoint -= 10;
      }
    }

    //Persona capo brigata in esterna
    const participantHeadOfRedBrigade = deploymentDoc
      .participants
      .map(x => x.toString())
      .find(x => x === episodeDoc.redBrigade[0].toString());
    const participantHeadOfBlueBrigade = deployment
      .participants
      .map(x => x.toString())
      .find(x => x === episode.blueBrigade[0].toString());
    if(participantHeadOfRedBrigade) {
      results.push({
        type: 'ParticipantHeadOfRedBrigade',
        participant: participantHeadOfRedBrigade,
        value: 15
      });
      resultsPoint += 15;
    }
    if(participantHeadOfBlueBrigade) {
      results.push({
        type: 'ParticipantHeadOfBlueBrigade',
        participant: participantHeadOfBlueBrigade,
        value: 15
      });
      resultsPoint += 15;
    }

    //Persona nella brigata vincitrice
    const winnerBrigade = episode.redBrigadeWins
      ? episodeDoc.redBrigade
      : episodeDoc.blueBrigade;

    const participantsInWinnerBrigade = _.intersectionWith(
      deployment.participants,
      winnerBrigade,
      _.isEqual
    );
    for(let participantInWinnerBrigade of participantsInWinnerBrigade){
      results.push({
        type: 'ParticipantInWinnerBrigade',
        participant: participantInWinnerBrigade,
        value: 10
      });
      resultsPoint += 10
    }
  }

  //Pressure test
  const participantsInPressureTest =  _.intersectionWith(
    deployment.participants,
    episode.pressureTest,
    _.isEqual
  );
  for(let participantInPressureTest of participantsInPressureTest){
    results.push({
      type: 'ParticipantInPressureTest',
      participant: participantInPressureTest,
      value: -5
    });
    resultsPoint -= 5
  }

  //Persona eliminata nella puntata
  const participantsEliminated = _.intersectionWith(
    deployment.participants,
    episode.eliminated,
    _.isEqual
  );
  for(let participantEliminated of participantsEliminated){
    results.push({
      type: 'ParticipantEliminated',
      participant: participantEliminated,
      value: -15
    });
    resultsPoint -= 15;

    const participant = await Participant.findById(participantEliminated);
    if(participant && !participant.eliminated){
      await Participant.findByIdAndUpdate(
        participantEliminated,
        {$set: {eliminated: true}},
        {new: true}
      )
    }
  }
  return {
    results,
    resultsPoint
  }
}

module.exports = router;