/**
 * User Model for MongoDB
 */

const mongoose = require('mongoose');
const { Schema } = mongoose;

// Define User Schema
const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email address']
  },
  passwordHash: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  verified: {
    type: Boolean,
    default: false
  },
  active: {
    type: Boolean,
    default: true
  },
  preferences: {
    theme: {
      type: String,
      default: 'system'
    },
    language: {
      type: String,
      default: 'en'
    },
    notifications: {
      type: Boolean,
      default: true
    }
  },
  lastLogin: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Add pre-save hook for updating timestamps
userSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Export model only if mongoose is available
let User;
try {
  // Try to get existing model or create new one
  User = mongoose.models.User || mongoose.model('User', userSchema);
} catch (error) {
  // If mongoose is not available, create a placeholder
  User = null;
}

module.exports = User;