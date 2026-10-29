const express = require('express');
const { getCategories, getCategoryBySlug } = require('../controllers/category.controller');

const router = express.Router();

// GET /api/categories - Public list of active categories
router.get('/', getCategories);

// GET /api/categories/:slug - Public category by slug
router.get('/:slug', getCategoryBySlug);

module.exports = router;
