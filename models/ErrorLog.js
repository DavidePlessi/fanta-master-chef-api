const mongoose = require('mongoose');

const ErrorLogSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  error: {
    type: Object
  },
  date: {
    type: Date,
    default: Date.now
  }
});

module.exports = ErrorLog = mongoose.model('ErrorLog', ErrorLogSchema);