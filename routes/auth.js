const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('config');
const { check, validationResult } = require('express-validator');

const User = require('../models/User');
const {errorMessages} = require("../config/messages");

// @route   GET api/auth
// @desc    Test route
// @access  Public
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    console.log(err);
    res.status(500).json({errorCodes: [errorMessages.GenericError]});
  }
});

// @route   POST api/auth
// @desc    Authenticate user & get token
// @access  Public
router.post(
  '/',
  [
    check('email', errorMessages.InvalidEmail).isEmail(),
    check('password', errorMessages.PasswordRequired).exists()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    console.log(errors);
    if (!errors.isEmpty()) {
      console.error(errors.array().map(x => x.msg).join(', '));
      return res.status(400).json({ errorCodes: errors.array().map(x => x.msg) });
    }
    const { email, password } = req.body;
    try {
      let user = await User.findOne({ email });
      if (!user) {
        return res.status(400).json({
          errorCodes: [errorMessages.InvalidCredentials]
        });
      }

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(400).json({
          errorCodes: [errorMessages.InvalidCredentials]
        });
      }

      const payload = {
        user: {
          id: user.id
        },
        gameSessions: [...user.gameSessions]
      };

      jwt.sign(
        payload,
        process.env.jwtSecret || config.get('jwtSecret'),
        { expiresIn: 3600000 },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).json({errorCodes: [errorMessages.GenericError]});
    }
  }
);

module.exports = router;
