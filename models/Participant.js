const mongoose = require('mongoose');

const ParticipantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  editionNumber: {
    type: Number,
    required: true
  },
  description: {
    type: String
  },
  eliminated: {
    type: Boolean,
    default: true
  }
});

module.exports = Participant = mongoose.model('Participant', ParticipantSchema)