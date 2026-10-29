const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const { ROLES, ALL_ROLES, ALLOWED_REGISTRATION_ROLES } = require('../constants/roles');

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters long'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*$/,
        'Please provide a valid email address'
      ]
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters long'],
      select: false
    },
    role: {
      type: String,
      required: [true, 'Role is required'],
      enum: {
        values: ALL_ROLES,
        message: 'Invalid role specified'
      },
      default: ROLES.FARMER
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      unique: true,
      trim: true
    },
    isEmailVerified: {
      type: Boolean,
      default: false
    },
    allowDirectCalls: {
      type: Boolean,
      default: false
    },
    status: {
      type: String,
      enum: ['active', 'suspended', 'pending'],
      default: 'active'
    }
  },
  {
    timestamps: true
  }
);

// Hash password before saving
userSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Return safe user object without sensitive data
userSchema.methods.toSafeObject = function () {
  return {
    _id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    phone: this.phone,
    isEmailVerified: this.isEmailVerified,
    allowDirectCalls: this.allowDirectCalls,
    status: this.status,
    createdAt: this.createdAt
  };
};

const User = mongoose.model('User', userSchema);

module.exports = User;
