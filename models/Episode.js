const mongoose = require('mongoose');

const EpisodeSchema = new mongoose.Schema({
  number: {
    type: Number,
    required: true
  },
  editionNumber: {
    type: Number,
    required: true
  },
  isOutside: {
    type: Boolean,
    required: true
  },
  mysteryBoxPodium:  [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant'
  }],
  mysteryBoxWorst:  [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant'
  }],
  inventionTestPodium: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant'
  }],
  inventionTestWorst: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant'
  }],
  redBrigade: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant'
  }],
  blueBrigade: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant'
  }],
  redBrigadeWins: {
    type: Boolean
  },
  pressureTest: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant'
  }],
  eliminated: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant'
  }],
});

module.exports = Episode = mongoose.model('Episode', EpisodeSchema);