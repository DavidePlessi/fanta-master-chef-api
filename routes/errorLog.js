const express = require('express');
const router = express.Router();
const {check, validationResult} = require('express-validator');
const {errorMessages} = require('../config/messages');
const jwt = require('jsonwebtoken');
const config = require('config');

const ErrorLog = require('../models/ErrorLog');

// @route   POST api/errorLogs
// @desc    Create a error log
// @access  Public
router.post(
  '/',
  [[
   check('error', errorMessages.NotFound).exists()
  ]],
  async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()){
      return res.status(400).json({ errorCodes: errors.array().map(x => x.msg) });
    }
    try {
      let user = null;
      const token = req.header('x-auth-token');
      if(token){
        const decoded = jwt.verify(token, process.env.jwtSecret || config.get('jwtSecret'));
        user = decoded.user.id;
      }

      const errorLog = new ErrorLog({
        user: user,
        error: req.body.error
      });
      await errorLog.save();

      res.json(errorLog)

    } catch (e) {
      console.error(e);
      res.status(500).json({errorCodes: [errorMessages.GenericError]})
    }
  }
);
module.exports = router;