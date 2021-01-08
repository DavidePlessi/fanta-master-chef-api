const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {check, validationResult} = require('express-validator');
const {errorMessages, infoMessages} = require('../config/messages');

const Deployment = require('../models/Deployment');
const User = require('../models/User');
const Episode = require('../models/Episode');
const Participant = require('../models/Participant');
const mongoose = require("mongoose");

// @route   POST api/deployments
// @desc    Create a deployment
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('editionNumber', errorMessages.EpisodeIdIsRequired).not().isEmpty(),
      check('episodeNumber', errorMessages.EpisodeIdIsRequired).not().isEmpty(),
      check('participants', errorMessages.ParticipantsIsRequired).not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      return res.status(400).json({errors: errors.array()});
    }

    const {
      editionNumber,
      episodeNumber,
      participants
    } = req.body;

    const deploymentFields = {};

    deploymentFields.user = req.user.id;
    deploymentFields.date = Date.now();

    const episode = await Episode.findOne({number: episodeNumber, editionNumber: editionNumber});
    if(!episode) return res.status(404).json({errorCode: errorMessages.NotFound});
    const episodeId = episode._id;
    deploymentFields.episode = episodeId;

    if(participants){
      if(participants.length !== 4)
        return res.status(400).json({errorCode: errorMessages.ParticipantsNumber});
      deploymentFields.participants = participants.map(x => mongoose.Types.ObjectId(x));
    }

    try {
      let deployment = await Deployment.findOne({
        user: req.user.id,
        episode: episodeId
      });

      if(deployment) {
        deployment = await Deployment.findOneAndUpdate(
          {user: req.user.id, episode: episodeId},
          {$set: deploymentFields},
          {new: true}
        )
      } else {
        deployment = new Deployment(deploymentFields);
        await deployment.save()
      }
      await populateParticipant(deployment);
      return res.json(deployment);
    } catch (e) {
      console.error(e.message);
      res.status(500).send(errorMessages.GenericError);
    }
  }
);

// @route   GET api/deployments/my-deployment
// @desc    Get all user's deployment
// @access  Private
router.get(
  '/my-deployment',
  auth,
  async (req, res) => {
    try {
      const deployments = await Deployment.find({user: req.user.id});
      for(let deployment of deployments){
        await populateParticipant(deployment);
      }
      res.json(deployments);
    } catch (e) {
      console.log(e.message);
      res.status(500).send(errorMessages.GenericError);
    }
  }
);

// @route   GET api/deployments/:editionNumber/:episodeNumber
// @desc    Get a deployment, if not exist it create one
// @access  Private
router.get(
  '/:editionNumber/:episodeNumber',
  auth,
  async (req, res) => {
    try {
      const episode = await Episode.findOne(
        {number: req.params.episodeNumber, editionNumber: req.params.editionNumber}
      );
      if(!episode) return res.status(404).json({errorCode: errorMessages.NotFound});

      let deployment = await Deployment.findOne({user: req.user.id, episode: episode._id})
      if(!deployment) {
        deployment = new Deployment({episode: episode._id, user: req.user.id});
        await deployment.save();
      }
      await populateParticipant(deployment);

      res.json(deployment);
    } catch (e) {

    }
  }
)

async function populateParticipant(deployment) {
  const participants = [];
  for(let participantId of deployment.participants){
    const participant = await Participant.findById(participantId);
    participants.push(participant);
  }
  deployment.participants = participants;
}
module.exports = router;