const mongoose = require('mongoose');

const ALLOWED_UNITS = ['kg', 'quintal', 'ton', 'box', 'crate', 'bag', 'bale'];
const LISTING_STATUSES = ['draft', 'active', 'unavailable', 'archived', 'suspended'];

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      minlength: [2, 'Product name must be at least 2 characters long'],
      maxlength: [120, 'Product name cannot exceed 120 characters'],
      index: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
      default: ''
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Category reference is required'],
      index: true
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Product owner (farmer) is required'],
      index: true
    },
    variety: {
      type: String,
      trim: true,
      default: '',
      maxlength: [100, 'Variety cannot exceed 100 characters']
    },
    qualityGrade: {
      type: String,
      trim: true,
      default: 'Grade A',
      maxlength: [50, 'Quality grade cannot exceed 50 characters']
    },
    minOrderQuantity: {
      type: Number,
      default: 1,
      min: [0.01, 'Minimum order quantity must be greater than zero']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0.01, 'Price must be greater than zero']
    },
    currency: {
      type: String,
      default: 'INR',
      trim: true,
      uppercase: true
    },
    quantity: {
      type: Number,
      required: [true, 'Available quantity is required'],
      min: [0, 'Quantity cannot be negative']
    },
    unit: {
      type: String,
      required: [true, 'Unit is required'],
      enum: {
        values: ALLOWED_UNITS,
        message: 'Invalid unit. Allowed units: ' + ALLOWED_UNITS.join(', ')
      },
      default: 'quintal',
      lowercase: true,
      trim: true
    },
    location: {
      state: {
        type: String,
        required: [true, 'State is required'],
        trim: true
      },
      district: {
        type: String,
        trim: true,
        default: ''
      },
      village: {
        type: String,
        trim: true,
        default: ''
      },
      pincode: {
        type: String,
        trim: true,
        default: ''
      },
      mandi: {
        type: String,
        trim: true,
        default: ''
      }
    },
    status: {
      type: String,
      enum: {
        values: LISTING_STATUSES,
        message: 'Invalid status. Allowed statuses: ' + LISTING_STATUSES.join(', ')
      },
      default: 'active',
      index: true
    },
    images: {
      type: [String],
      default: []
    },
    imageAssets: [
      {
        url: {
          type: String,
          required: true
        },
        publicId: {
          type: String,
          required: true
        },
        format: {
          type: String,
          default: ''
        },
        bytes: {
          type: Number,
          default: 0
        },
        uploadedAt: {
          type: Date,
          default: Date.now
        }
      }
    ],
    moderation: {
      status: {
        type: String,
        enum: ['approved', 'flagged', 'suspended'],
        default: 'approved'
      },
      reason: {
        type: String,
        trim: true,
        default: ''
      },
      moderatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
      },
      moderatedAt: {
        type: Date,
        default: null
      }
    }
  },
  {
    timestamps: true
  }
);

// Compound text index for robust searching on name & description
productSchema.index({ name: 'text', description: 'text' });

// Safe public projection method
productSchema.methods.toPublicObject = function () {
  return {
    _id: this._id,
    name: this.name,
    variety: this.variety,
    qualityGrade: this.qualityGrade,
    description: this.description,
    category: this.category,
    owner: this.owner,
    price: this.price,
    currency: this.currency,
    quantity: this.quantity,
    minOrderQuantity: this.minOrderQuantity,
    unit: this.unit,
    location: this.location,
    status: this.status,
    images: this.images,
    imageAssets: this.imageAssets,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt
  };
};

const Product = mongoose.model('Product', productSchema);

module.exports = {
  Product,
  ALLOWED_UNITS,
  LISTING_STATUSES
};
