const Category = require('../models/Category');

/**
 * GET /api/categories
 * Returns active categories from MongoDB
 */
const getCategories = async (req, res, next) => {
  try {
    const filter = { isActive: true };

    const categories = await Category.find(filter)
      .select('-__v')
      .sort({ name: 1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: categories.length,
      data: categories
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/categories/:slug
 * Returns a category by its slug
 */
const getCategoryBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;

    if (!slug || typeof slug !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'A valid category slug is required'
      });
    }

    const cleanSlug = slug.trim().toLowerCase();

    const category = await Category.findOne({ slug: cleanSlug, isActive: true })
      .select('-__v')
      .lean();

    if (!category) {
      return res.status(404).json({
        success: false,
        message: `Category '${cleanSlug}' was not found or is inactive`
      });
    }

    return res.status(200).json({
      success: true,
      data: category
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getCategories,
  getCategoryBySlug
};
