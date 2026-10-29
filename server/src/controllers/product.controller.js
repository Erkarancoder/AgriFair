const mongoose = require('mongoose');
const { Product, ALLOWED_UNITS, LISTING_STATUSES } = require('../models/Product');
const Category = require('../models/Category');
const imageStorageService = require('../services/imageStorage.service');


// Helper to escape regex special characters
const escapeRegex = (string) => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

/**
 * GET /api/products
 * Public listing of active products with category filtering, search, sorting, and pagination
 */
const getProducts = async (req, res, next) => {
  try {
    const {
      category,
      q,
      search,
      sort = 'newest',
      page = 1,
      limit = 12
    } = req.query;

    const query = { status: 'active' };

    // 1. Category filtering (by ObjectId or Slug)
    if (category && category !== 'all') {
      if (mongoose.Types.ObjectId.isValid(category)) {
        query.category = category;
      } else {
        const foundCategory = await Category.findOne({
          slug: category.toLowerCase().trim(),
          isActive: true
        });

        if (!foundCategory) {
          // Category does not exist -> return valid empty result
          return res.status(200).json({
            success: true,
            count: 0,
            total: 0,
            totalPages: 0,
            currentPage: Number(page) || 1,
            data: []
          });
        }
        query.category = foundCategory._id;
      }
    }

    // 2. Search query (matches name or description)
    const searchTerm = (q || search || '').trim();
    if (searchTerm) {
      const safeRegex = new RegExp(escapeRegex(searchTerm), 'i');
      query.$or = [
        { name: safeRegex },
        { description: safeRegex }
      ];
    }

    // 3. Sorting configuration
    let sortOption = { createdAt: -1 }; // default: newest
    if (sort === 'price-asc') {
      sortOption = { price: 1 };
    } else if (sort === 'price-desc') {
      sortOption = { price: -1 };
    } else if (sort === 'oldest') {
      sortOption = { createdAt: 1 };
    }

    // 4. Pagination validation
    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));
    const skip = (parsedPage - 1) * parsedLimit;

    // 5. Query execution with DB-level count and safe population
    const [total, products] = await Promise.all([
      Product.countDocuments(query),
      Product.find(query)
        .sort(sortOption)
        .skip(skip)
        .limit(parsedLimit)
        .populate('category', 'name slug iconName tagline')
        .populate('owner', 'name role')
        .select('-__v')
        .lean()
    ]);

    const totalPages = Math.ceil(total / parsedLimit);

    return res.status(200).json({
      success: true,
      count: products.length,
      total,
      totalPages,
      currentPage: parsedPage,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const product = await Product.findById(id)
      .populate('category', 'name slug iconName tagline description')
      .populate('owner', 'name role phone allowDirectCalls createdAt')
      .select('-__v')
      .lean();

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product listing not found'
      });
    }

    // Safe disclosure: only expose seller phone if consent is explicitly granted
    if (product.owner) {
      const isCallPermitted = Boolean(product.owner.allowDirectCalls);
      product.owner = {
        _id: product.owner._id,
        name: product.owner.name,
        role: product.owner.role,
        createdAt: product.owner.createdAt,
        allowDirectCalls: isCallPermitted,
        phone: isCallPermitted ? product.owner.phone : null
      };
    }

    return res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/products
 * Authenticated farmer endpoint to create a new product listing
 */
const createProduct = async (req, res, next) => {
  try {
    const {
      name,
      variety = '',
      qualityGrade = 'Grade A',
      minOrderQuantity = 1,
      description,
      categoryId,
      category,
      price,
      currency = 'INR',
      quantity,
      unit = 'quintal',
      location,
      images = [],
      imageAssets = []
    } = req.body;

    // Server-side validation
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Product name must be at least 2 characters long'
      });
    }

    // Category ID resolution
    const catTarget = categoryId || category;
    if (!catTarget || !mongoose.Types.ObjectId.isValid(catTarget)) {
      return res.status(400).json({
        success: false,
        message: 'A valid Category ID is required'
      });
    }

    const categoryDoc = await Category.findOne({ _id: catTarget, isActive: true });
    if (!categoryDoc) {
      return res.status(400).json({
        success: false,
        message: 'Specified category does not exist or is inactive'
      });
    }

    // Price validation
    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Price must be a valid positive number greater than 0'
      });
    }

    // Quantity validation
    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity < 0) {
      return res.status(400).json({
        success: false,
        message: 'Quantity cannot be negative'
      });
    }

    // Min Order Quantity validation
    const numMinOrder = Number(minOrderQuantity);
    const validMinOrder = !isNaN(numMinOrder) && numMinOrder > 0 ? numMinOrder : 1;

    // Unit validation
    const normalizedUnit = (unit || '').toLowerCase().trim();
    if (!ALLOWED_UNITS.includes(normalizedUnit)) {
      return res.status(400).json({
        success: false,
        message: `Invalid unit. Allowed units: ${ALLOWED_UNITS.join(', ')}`
      });
    }

    // Location validation
    if (!location || !location.state || !location.state.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Location with a valid state is required'
      });
    }

    // Format & synchronize images & imageAssets
    const validatedAssets = Array.isArray(imageAssets)
      ? imageAssets
          .filter((a) => a && a.url && a.publicId)
          .map((a) => ({
            url: a.url,
            publicId: a.publicId,
            format: a.format || '',
            bytes: a.bytes || 0
          }))
      : [];

    const finalImageUrls = Array.isArray(images) ? [...images] : [];
    validatedAssets.forEach((a) => {
      if (!finalImageUrls.includes(a.url)) {
        finalImageUrls.push(a.url);
      }
    });

    // STRICT OWNER DERIVATION: Never trust frontend owner ID!
    const product = new Product({
      name: name.trim(),
      variety: typeof variety === 'string' ? variety.trim() : '',
      qualityGrade: typeof qualityGrade === 'string' ? qualityGrade.trim() : 'Grade A',
      minOrderQuantity: validMinOrder,
      description: (description || '').trim(),
      category: categoryDoc._id,
      owner: req.user._id,
      price: numPrice,
      currency: (currency || 'INR').toUpperCase().trim(),
      quantity: numQuantity,
      unit: normalizedUnit,
      location: {
        state: location.state.trim(),
        district: (location.district || '').trim(),
        mandi: (location.mandi || '').trim()
      },
      status: 'active',
      images: finalImageUrls,
      imageAssets: validatedAssets
    });

    await product.save();

    // Populate and return clean result
    const populated = await Product.findById(product._id)
      .populate('category', 'name slug iconName')
      .populate('owner', 'name phone role')
      .select('-__v')
      .lean();

    return res.status(201).json({
      success: true,
      message: 'Product listed successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/mine
 * Return only the authenticated farmer's own listings
 */
const getMyProducts = async (req, res, next) => {
  try {
    const products = await Product.find({ owner: req.user._id })
      .sort({ createdAt: -1 })
      .populate('category', 'name slug iconName tagline')
      .populate('owner', 'name phone role')
      .select('-__v')
      .lean();

    return res.status(200).json({
      success: true,
      count: products.length,
      data: products
    });
  } catch (error) {
    next(error);
  }
};

/**
 * PATCH /api/products/:id
 * Update an existing listing owned by the authenticated farmer
 */
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product listing not found'
      });
    }

    // Ownership check: strictly enforce that only the owner farmer can modify
    if (product.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this listing'
      });
    }

    const {
      name,
      variety,
      qualityGrade,
      minOrderQuantity,
      description,
      categoryId,
      category,
      price,
      currency,
      quantity,
      unit,
      location,
      status,
      images
    } = req.body;

    // Validate name if provided
    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Product name must be at least 2 characters long'
        });
      }
      product.name = name.trim();
    }

    if (variety !== undefined) {
      product.variety = typeof variety === 'string' ? variety.trim() : '';
    }

    if (qualityGrade !== undefined) {
      product.qualityGrade = typeof qualityGrade === 'string' ? qualityGrade.trim() : 'Grade A';
    }

    if (minOrderQuantity !== undefined) {
      const numMin = Number(minOrderQuantity);
      if (!isNaN(numMin) && numMin > 0) {
        product.minOrderQuantity = numMin;
      }
    }

    // Validate description if provided
    if (description !== undefined) {
      product.description = (description || '').trim();
    }

    // Validate category if provided
    const catTarget = categoryId || category;
    if (catTarget !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(catTarget)) {
        return res.status(400).json({
          success: false,
          message: 'A valid Category ID is required'
        });
      }
      const categoryDoc = await Category.findOne({ _id: catTarget, isActive: true });
      if (!categoryDoc) {
        return res.status(400).json({
          success: false,
          message: 'Specified category does not exist or is inactive'
        });
      }
      product.category = categoryDoc._id;
    }

    // Validate price if provided
    if (price !== undefined) {
      const numPrice = Number(price);
      if (isNaN(numPrice) || numPrice <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Price must be a valid positive number greater than 0'
        });
      }
      product.price = numPrice;
    }

    // Validate quantity if provided
    if (quantity !== undefined) {
      const numQuantity = Number(quantity);
      if (isNaN(numQuantity) || numQuantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'Quantity cannot be negative'
        });
      }
      product.quantity = numQuantity;
    }

    // Validate unit if provided
    if (unit !== undefined) {
      const normalizedUnit = (unit || '').toLowerCase().trim();
      if (!ALLOWED_UNITS.includes(normalizedUnit)) {
        return res.status(400).json({
          success: false,
          message: `Invalid unit. Allowed units: ${ALLOWED_UNITS.join(', ')}`
        });
      }
      product.unit = normalizedUnit;
    }

    // Validate location if provided
    if (location !== undefined) {
      if (!location || !location.state || !location.state.trim()) {
        return res.status(400).json({
          success: false,
          message: 'Location with a valid state is required'
        });
      }
      product.location = {
        state: location.state.trim(),
        district: (location.district || '').trim(),
        mandi: (location.mandi || '').trim()
      };
    }

    // Validate status if provided
    if (status !== undefined) {
      if (!LISTING_STATUSES.includes(status)) {
        return res.status(400).json({
          success: false,
          message: `Invalid status. Allowed statuses: ${LISTING_STATUSES.join(', ')}`
        });
      }
      product.status = status;
    }

    if (currency !== undefined) {
      product.currency = (currency || 'INR').toUpperCase().trim();
    }

    if (images !== undefined && Array.isArray(images)) {
      product.images = images;
    }

    const { imageAssets } = req.body;
    if (imageAssets !== undefined && Array.isArray(imageAssets)) {
      product.imageAssets = imageAssets
        .filter((a) => a && a.url && a.publicId)
        .map((a) => ({
          url: a.url,
          publicId: a.publicId,
          format: a.format || '',
          bytes: a.bytes || 0
        }));

      // Synchronize images with imageAssets
      product.imageAssets.forEach((a) => {
        if (!product.images.includes(a.url)) {
          product.images.push(a.url);
        }
      });
    }

    await product.save();

    const populated = await Product.findById(product._id)
      .populate('category', 'name slug iconName tagline')
      .populate('owner', 'name phone role')
      .select('-__v')
      .lean();

    return res.status(200).json({
      success: true,
      message: 'Listing updated successfully',
      data: populated
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/products/:id
 * Delete an owned listing by the authenticated farmer
 * Safely removes associated Cloudinary assets without deleting unrelated assets
 */
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product listing not found'
      });
    }

    // Ownership check: strictly enforce that only the owner farmer can delete
    if (product.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this listing'
      });
    }

    // Safely delete associated image assets from Cloudinary
    if (Array.isArray(product.imageAssets) && product.imageAssets.length > 0) {
      for (const asset of product.imageAssets) {
        if (asset && asset.publicId) {
          try {
            await imageStorageService.deleteImage(asset.publicId);
          } catch (storageErr) {
            console.warn(`[DeleteProduct] Could not delete asset ${asset.publicId}:`, storageErr.message);
          }
        }
      }
    }

    await Product.deleteOne({ _id: product._id });

    return res.status(200).json({
      success: true,
      message: 'Listing deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/products/storage-status
 * Check whether real image storage (Cloudinary) is configured
 */
const getStorageStatus = async (req, res) => {
  const status = imageStorageService.getStatus();
  return res.status(200).json({
    success: true,
    data: status
  });
};

/**
 * POST /api/products/upload-image
 * Upload a single image file for a farmer listing to Cloudinary
 */
const uploadProductImage = async (req, res, next) => {
  try {
    if (!imageStorageService.isConfigured()) {
      return res.status(503).json({
        success: false,
        isConfigured: false,
        code: 'STORAGE_NOT_CONFIGURED',
        message:
          'Image storage provider is not configured in server environment. Set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET in server/.env to enable real product photo uploads.'
      });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'No image file was provided for upload.'
      });
    }

    const result = await imageStorageService.uploadImageBuffer(req.file.buffer, {
      folder: 'agrifair/products',
      tags: ['agrifair', 'produce', `farmer_${req.user._id}`]
    });

    return res.status(200).json({
      success: true,
      message: 'Image uploaded successfully to Cloudinary',
      data: {
        url: result.url,
        publicId: result.publicId,
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/products/:id/images
 * Upload and attach an image directly to an existing owned product listing
 */
const attachImageToProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product listing not found'
      });
    }

    // Ownership check
    if (product.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this listing'
      });
    }

    if (!imageStorageService.isConfigured()) {
      return res.status(503).json({
        success: false,
        isConfigured: false,
        code: 'STORAGE_NOT_CONFIGURED',
        message:
          'Image storage provider is not configured. Real image uploads require Cloudinary credentials.'
      });
    }

    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: 'No image file was provided for upload.'
      });
    }

    const result = await imageStorageService.uploadImageBuffer(req.file.buffer, {
      folder: 'agrifair/products',
      tags: ['agrifair', `product_${id}`]
    });

    // Store in imageAssets and images
    product.imageAssets.push({
      url: result.url,
      publicId: result.publicId,
      format: result.format,
      bytes: result.bytes
    });

    if (!product.images.includes(result.url)) {
      product.images.push(result.url);
    }

    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Image attached to listing successfully',
      data: {
        image: result,
        images: product.images,
        imageAssets: product.imageAssets
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * DELETE /api/products/:id/images/:publicId
 * Remove an image from an owned listing and delete from Cloudinary
 */
const removeImageFromProduct = async (req, res, next) => {
  try {
    const { id, publicId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format'
      });
    }

    const product = await Product.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product listing not found'
      });
    }

    // Ownership check
    if (product.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to modify this listing'
      });
    }

    // Find asset
    const decodedPublicId = decodeURIComponent(publicId);
    const asset = product.imageAssets.find(
      (a) => a.publicId === decodedPublicId || a.publicId === publicId
    );

    if (!asset) {
      return res.status(404).json({
        success: false,
        message: 'Image asset not found on this listing'
      });
    }

    // Delete from Cloudinary
    await imageStorageService.deleteImage(asset.publicId);

    // Remove from product document
    product.imageAssets = product.imageAssets.filter((a) => a.publicId !== asset.publicId);
    product.images = product.images.filter((url) => url !== asset.url);

    await product.save();

    return res.status(200).json({
      success: true,
      message: 'Image removed from listing successfully',
      data: {
        images: product.images,
        imageAssets: product.imageAssets
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};

