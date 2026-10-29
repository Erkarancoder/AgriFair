const express = require('express');
const {
  getMandiSuggestions,
  getMandiFilterOptions,
  searchMandis,
  getPopularMandis,
  getMandiById,
  triggerOfficialSync,
  getMandiSyncStatus
} = require('../controllers/mandi.controller');

const router = express.Router();

// Publicly accessible mandi rates & provenance status
router.get('/sync/status', getMandiSyncStatus);
router.post('/sync', triggerOfficialSync);
router.get('/suggestions', getMandiSuggestions);
router.get('/filter-options', getMandiFilterOptions);
router.get('/search', searchMandis);
router.get('/popular', getPopularMandis);
router.get('/:id', getMandiById);
router.get('/', searchMandis);

module.exports = router;
