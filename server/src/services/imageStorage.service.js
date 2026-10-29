const fs = require('fs');
const path = require('path');
const cloudinary = require('cloudinary').v2;
const config = require('../config/env');

// Configure Cloudinary SDK if credentials exist in environment
if (config.cloudinary.isConfigured) {
  cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true
  });
}

/**
 * Image storage service for real, secure product photo management
 * Supports Cloudinary when configured, with automatic local disk storage fallback
 */
class ImageStorageService {
  constructor() {
    this.uploadsDir = path.resolve(__dirname, '../../uploads/products');
    if (!fs.existsSync(this.uploadsDir)) {
      try {
        fs.mkdirSync(this.uploadsDir, { recursive: true });
      } catch (err) {
        console.warn('[ImageStorageService] Could not pre-create uploads directory:', err.message);
      }
    }
  }

  /**
   * Check whether image storage is ready (Cloudinary or local fallback)
   */
  isConfigured() {
    return true;
  }

  isCloudinaryConfigured() {
    return Boolean(config.cloudinary && config.cloudinary.isConfigured);
  }

  /**
   * Return safe provider status (never exposing secrets or API keys)
   */
  getStatus() {
    const isCloudinary = this.isCloudinaryConfigured();
    return {
      isConfigured: true,
      provider: 'Cloudinary',
      storageMode: isCloudinary ? 'cloudinary' : 'local',
      cloudName: isCloudinary ? config.cloudinary.cloudName : null,
      supportedMimeTypes: ['image/jpeg', 'image/png', 'image/webp'],
      maxFileSizeMb: 5
    };
  }

  /**
   * Upload an in-memory image buffer
   * If Cloudinary is configured -> upload to Cloudinary
   * Otherwise -> save to local disk storage server/uploads/products
   * @param {Buffer} buffer - In-memory image buffer from multer
   * @param {Object} options - Upload options (folder, custom tag, etc.)
   * @returns {Promise<Object>} Confirmation payload with accessible URL
   */
  async uploadImageBuffer(buffer, options = {}) {
    if (!buffer || !Buffer.isBuffer(buffer) || buffer.length === 0) {
      const err = new Error('Invalid or empty image file buffer provided for upload.');
      err.statusCode = 400;
      throw err;
    }

    // 1. If Cloudinary credentials configured, use Cloudinary
    if (this.isCloudinaryConfigured()) {
      const { folder = 'agrifair/products', tags = ['agrifair', 'produce'] } = options;

      return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
          {
            folder,
            resource_type: 'image',
            allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
            transformation: [
              { quality: 'auto:good' },
              { fetch_format: 'auto' }
            ],
            tags
          },
          (error, result) => {
            if (error) {
              console.error('[ImageStorageService] Cloudinary upload error:', error);
              const uploadErr = new Error(`Cloudinary upload failed: ${error.message || 'Unknown error'}`);
              uploadErr.statusCode = 502;
              return reject(uploadErr);
            }

            if (!result || !result.secure_url) {
              const uploadErr = new Error('Cloudinary response did not confirm a valid storage URL.');
              uploadErr.statusCode = 502;
              return reject(uploadErr);
            }

            resolve({
              url: result.secure_url,
              publicId: result.public_id,
              format: result.format,
              bytes: result.bytes,
              width: result.width,
              height: result.height,
              createdAt: result.created_at
            });
          }
        );

        uploadStream.end(buffer);
      });
    }

    // 2. Otherwise: Save locally to disk
    if (!fs.existsSync(this.uploadsDir)) {
      fs.mkdirSync(this.uploadsDir, { recursive: true });
    }

    // Detect format from buffer magic bytes
    let ext = 'jpg';
    if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47) {
      ext = 'png';
    } else if (
      buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46 &&
      buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50
    ) {
      ext = 'webp';
    }

    const uniqueId = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const fileName = `${uniqueId}.${ext}`;
    const filePath = path.join(this.uploadsDir, fileName);

    await fs.promises.writeFile(filePath, buffer);

    const baseUrl = process.env.BASE_URL || `http://localhost:${config.port || 5000}`;
    const publicUrl = `${baseUrl}/uploads/products/${fileName}`;

    return {
      url: publicUrl,
      publicId: `local:${fileName}`,
      format: ext,
      bytes: buffer.length,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Delete an image using publicId
   * @param {string} publicId - Cloudinary asset ID or local:filename
   */
  async deleteImage(publicId) {
    if (!publicId || typeof publicId !== 'string') {
      return { success: false, reason: 'invalid_id' };
    }

    if (publicId.startsWith('local:')) {
      try {
        const fileName = publicId.replace('local:', '');
        const filePath = path.join(this.uploadsDir, fileName);
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
        }
        return { success: true, mode: 'local' };
      } catch (err) {
        console.error('[ImageStorageService] Local delete error:', err.message);
        return { success: false, error: err.message };
      }
    }

    if (this.isCloudinaryConfigured()) {
      try {
        const result = await cloudinary.uploader.destroy(publicId, {
          resource_type: 'image',
          invalidate: true
        });
        return { success: result.result === 'ok', result };
      } catch (error) {
        console.error(`[ImageStorageService] Failed to delete image ${publicId}:`, error.message);
        return { success: false, error: error.message };
      }
    }

    return { success: true };
  }
}

const imageStorageService = new ImageStorageService();

module.exports = imageStorageService;
