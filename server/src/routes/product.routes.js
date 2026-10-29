const express = require('express');
const {
  getProducts,
  getProductById,
  getMyProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  getStorageStatus,
  uploadProductImage,
  attachImageToProduct,
  removeImageFromProduct
} = require('../controllers/product.controller');
const { protect, restrictTo } = require('../middleware/auth');
const { uploadSingleProductImage } = require('../middleware/upload');
const { imageUploadLimiter } = require('../middleware/rateLimiter');
const { ROLES } = require('../constants/roles');

const router = express.Router();

// 1. Storage provider status check
router.get('/storage-status', protect, getStorageStatus);

// 2. Authenticated Farmer: My Listings (registered before /:id to prevent route collision)
router.get('/mine', protect, restrictTo(ROLES.FARMER), getMyProducts);

// 3. Standalone product photo upload for farmer listing forms (rate limited)
router.post(
  '/upload-image',
  protect,
  restrictTo(ROLES.FARMER),
  imageUploadLimiter,
  uploadSingleProductImage,
  uploadProductImage
);

// 4. Public endpoints
router.get('/', getProducts);
router.get('/:id', getProductById);

// 5. Protected Farmer Mutation endpoints: create, update, delete
router.post('/', protect, restrictTo(ROLES.FARMER), createProduct);
router.patch('/:id', protect, restrictTo(ROLES.FARMER), updateProduct);
router.delete('/:id', protect, restrictTo(ROLES.FARMER), deleteProduct);

// 6. Direct listing image attachment and removal endpoints
router.post(
  '/:id/images',
  protect,
  restrictTo(ROLES.FARMER),
  imageUploadLimiter,
  uploadSingleProductImage,
  attachImageToProduct
);
router.delete(
  '/:id/images/:publicId',
  protect,
  restrictTo(ROLES.FARMER),
  removeImageFromProduct
);

module.exports = router;

