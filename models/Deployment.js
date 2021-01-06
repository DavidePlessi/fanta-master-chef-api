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
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = Deployment = mongoose.model('Deployment', DeploymentSchema);