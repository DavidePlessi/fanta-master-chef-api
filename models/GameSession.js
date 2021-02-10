const mongoose = require('mongoose');

const GameSessionSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
})

module.exports = GameSession = mongoose.model('GameSession', GameSessionSchema);