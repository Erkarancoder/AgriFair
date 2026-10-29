const multer = require('multer');

// Supported MIME types and extensions
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

// In-memory storage for safe inspection and streaming to Cloudinary
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const isAllowedMime = ALLOWED_MIME_TYPES.includes(file.mimetype?.toLowerCase());
  const hasAllowedExt = /\.(jpe?g|png|webp)$/i.test(file.originalname || '');

  if (!isAllowedMime || !hasAllowedExt) {
    const error = new Error(
      'Invalid file format. Only JPEG, PNG, and WebP image formats are supported.'
    );
    error.statusCode = 400;
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES,
    files: 1
  },
  fileFilter
});

/**
 * Validates actual binary magic bytes of the buffer to prevent spoofed file extensions
 * @param {Buffer} buffer
 * @returns {boolean}
 */
const verifyImageMagicBytes = (buffer) => {
  if (!buffer || !Buffer.isBuffer(buffer) || buffer.length < 12) {
    return false;
  }

  // 1. JPEG signature: FF D8 FF
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  if (isJpeg) return true;

  // 2. PNG signature: 89 50 4E 47 (0x89 'P' 'N' 'G')
  const isPng =
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47;
  if (isPng) return true;

  // 3. WebP signature: 'RIFF' .... 'WEBP'
  const isRiff =
    buffer[0] === 0x52 &&
    buffer[1] === 0x49 &&
    buffer[2] === 0x46 &&
    buffer[3] === 0x46;
  const isWebp =
    buffer[8] === 0x57 &&
    buffer[9] === 0x45 &&
    buffer[10] === 0x42 &&
    buffer[11] === 0x50;

  if (isRiff && isWebp) return true;

  return false;
};

/**
 * Middleware wrapper for single product image upload with clean user error messages
 */
const uploadSingleProductImage = (req, res, next) => {
  const uploader = upload.single('image');

  uploader(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          code: 'FILE_TOO_LARGE',
          message: 'Image exceeds maximum file size of 5 MB. Please select a smaller photo.'
        });
      }

      if (err.code === 'INVALID_FILE_TYPE' || err.statusCode === 400) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_FILE_TYPE',
          message: err.message
        });
      }

      return res.status(400).json({
        success: false,
        message: err.message || 'Error occurred while processing image upload'
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        code: 'NO_FILE_PROVIDED',
        message: 'No image file was uploaded. Please attach a valid image in the "image" field.'
      });
    }

    // Deep binary content inspection via magic bytes
    if (!verifyImageMagicBytes(req.file.buffer)) {
      return res.status(400).json({
        success: false,
        code: 'CORRUPTED_OR_DISGUISED_IMAGE',
        message:
          'File content validation failed. The uploaded file is not a valid JPEG, PNG, or WebP image.'
      });
    }

    next();
  });
};

module.exports = {
  uploadSingleProductImage,
  verifyImageMagicBytes,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES
};
