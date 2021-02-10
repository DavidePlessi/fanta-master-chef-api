const mongoose = require('mongoose');

const DeploymentSchema = new mongoose.Schema({
  episode: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Episode'
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant'
  }],
  results: {
    type: Object
  },
  date: {
    type: Date,
    default: Date.now
  },
  gameSession: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'GameSession'
  }
});

module.exports = Deployment = mongoose.model('Deployment', DeploymentSchema);