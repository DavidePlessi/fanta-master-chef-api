const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const {check, validationResult} = require('express-validator');
const {errorMessages, infoMessages} = require('../config/messages');

const FantaBrigade = require('../models/FantaBrigade');
const Participant = require('../models/Participant');
const User = require('../models/User');

module.exports = router;