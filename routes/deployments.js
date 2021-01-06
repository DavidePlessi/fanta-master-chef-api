const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {check, validationResult} = require('express-validator');
const {errorMessages, infoMessages} = require('../config/messages');

const Deployment = require('../models/Deployment');
const User = require('../models/User');
const Episode = require('../models/Episode');
const Participant = require('../models/Participant');

// @route   POST api/deployments
// @desc    Create a deployment
// @access  Private
router.post(
  '/',
  [
    auth,
    [
      check('episodeId', errorMessages.EpisodeIdIsRequired).not().isEmpty(),
      check('participants', errorMessages.ParticipantsIsRequired).not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      return res.status(400).json({errors: errors.array()});
    }

    const {
      episodeId,
      participatns
    } = req.body;

    const deploymentFields = {};

    deploymentFields.user = req.user.id;
    deploymentFields.date = Date.now();
    if(episodeId){
      const episode = await Episode.findById(episodeId);
      if(!episode) return res.status(404).json({errorCode: errorMessages.NotFound});
      deploymentFields.episode = episode._id;
    }
    if(participatns){
      if(participatns.length !== 4)
        return res.status(400).json({errorCode: errorMessages.ParticipantsNumber});
      deploymentFields.participants = participatns;
    }

    try {
      let deployment = await Episode.findOne({
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

      return res.json(deployment);
    } catch (e) {
      console.error(e.message);
      res.status(500).send(errorMessages.GenericError);
    }
  }
);

module.exports = router;