const mongoose = require('mongoose');

const commodityRateSchema = new mongoose.Schema({
  commodity: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  category: {
    type: String,
    trim: true,
    default: 'Grains & Cereals'
  },
  variety: {
    type: String,
    trim: true,
    default: 'Standard / Desi'
  },
  grade: {
    type: String,
    trim: true,
    default: 'FAQ'
  },
  minPrice: {
    type: Number,
    required: true,
    min: 0
  },
  maxPrice: {
    type: Number,
    required: true,
    min: 0
  },
  modalPrice: {
    type: Number,
    required: true,
    min: 0
  },
  unit: {
    type: String,
    default: 'quintal',
    trim: true
  },
  arrivalQuantity: {
    type: String,
    default: null
  },
  trend: {
    type: String,
    enum: ['up', 'down', 'stable'],
    default: 'stable'
  },
  priceChange: {
    type: Number,
    default: 0
  },
  marketDate: {
    type: Date,
    default: () => new Date('2026-10-15')
  },
  dataSource: {
    type: String,
    default: 'Sample Reference Benchmark (Unverified)'
  },
  isVerifiedSource: {
    type: Boolean,
    default: false
  },
  sourceRecordId: {
    type: String,
    trim: true,
    default: null
  },
  updatedAt: {
    type: Date,
    default: () => new Date('2026-10-15')
  }
});

const mandiRateSchema = new mongoose.Schema(
  {
    mandi: {
      type: String,
      required: [true, 'Mandi name is required'],
      trim: true,
      index: true
    },
    district: {
      type: String,
      required: [true, 'District is required'],
      trim: true,
      index: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true,
      index: true
    },
    marketType: {
      type: String,
      default: 'APMC Principal Mandi'
    },
    marketDate: {
      type: Date,
      default: () => new Date('2026-10-15')
    },
    dataSource: {
      type: String,
      default: 'Sample Reference Benchmark (Unverified)'
    },
    isVerifiedSource: {
      type: Boolean,
      default: false
    },
    sourceResourceId: {
      type: String,
      default: null,
      trim: true
    },
    lastSyncedAt: {
      type: Date,
      default: null
    },
    commodities: [commodityRateSchema],
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Compound text & field indexes for search and duplicate prevention
mandiRateSchema.index({ mandi: 'text', district: 'text', state: 'text' });
mandiRateSchema.index({ state: 1, district: 1 });
mandiRateSchema.index({ mandi: 1, district: 1, state: 1, isVerifiedSource: 1 });

const MandiRate = mongoose.model('MandiRate', mandiRateSchema);

module.exports = MandiRate;
