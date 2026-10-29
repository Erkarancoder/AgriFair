const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Category name is required'],
      trim: true,
      minlength: [2, 'Category name must be at least 2 characters long'],
      maxlength: [100, 'Category name cannot exceed 100 characters']
    },
    slug: {
      type: String,
      required: [true, 'Category slug is required'],
      unique: true,
      lowercase: true,
      trim: true,
      index: true
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
      default: ''
    },
    tagline: {
      type: String,
      trim: true,
      default: ''
    },
    iconName: {
      type: String,
      trim: true,
      default: ''
    },
    image: {
      type: String,
      trim: true,
      default: ''
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    parentCategory: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      default: null
    }
  },
  {
    timestamps: true
  }
);

// Method to get public category data
categorySchema.methods.toPublicObject = function () {
  return {
    _id: this._id,
    name: this.name,
    slug: this.slug,
    description: this.description,
    tagline: this.tagline,
    iconName: this.iconName,
    image: this.image,
    isActive: this.isActive,
    parentCategory: this.parentCategory,
    createdAt: this.createdAt
  };
};

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
