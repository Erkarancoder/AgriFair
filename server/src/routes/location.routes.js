const express = require('express');
const { lookupPincode } = require('../controllers/location.controller');

const router = express.Router();

// GET /api/location/pincode/:pincode - Public endpoint for postal code auto-fetch
router.get('/pincode/:pincode', lookupPincode);

module.exports = router;

