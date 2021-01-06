const mongoose = require('mongoose');

const FantaBrigadeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Participant'
  }],
  results: [{
    type: Object
  }]
});

module.exports = FantaBrigade = mongoose.model('FantaBrigade', FantaBrigadeSchema);