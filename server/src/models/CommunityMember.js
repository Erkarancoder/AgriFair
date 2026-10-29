const mongoose = require('mongoose');

const communityMemberSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    role: {
      type: String,
      enum: ['farmer', 'trader', 'wholesaler', 'fpo_head', 'retailer', 'agritech'],
      default: 'farmer'
    },
    roleTitle: {
      type: String,
      default: 'Progressive Farmer'
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    district: {
      type: String,
      default: ''
    },
    primaryCrop: {
      type: String,
      default: 'Multiple Crops'
    },
    avatar: {
      type: String,
      default: 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=160&h=160&fit=crop&crop=faces&auto=format&q=80'
    },
    farmSize: {
      type: String,
      default: '5 Acres'
    },
    experienceYears: {
      type: Number,
      default: 5
    },
    bio: {
      type: String,
      maxlength: [300, 'Bio cannot exceed 300 characters'],
      default: 'Proud member of the AgriFair farming community.'
    },
    badge: {
      type: String,
      default: 'Verified Kisan'
    },
    isVerified: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

communityMemberSchema.index({ createdAt: -1 });
communityMemberSchema.index({ state: 1, role: 1 });

module.exports = mongoose.model('CommunityMember', communityMemberSchema);
