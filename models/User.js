const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  writingStyle: {
    voice: {
      type: String,
      enum: ['professional', 'casual', 'friendly', 'authoritative', 'conversational'],
      default: 'professional'
    },
    complexity: {
      type: String,
      enum: ['simple', 'moderate', 'advanced'],
      default: 'moderate'
    },
    structure: {
      type: String,
      enum: ['traditional', 'storytelling', 'list-based', 'question-answer'],
      default: 'traditional'
    },
    examples: {
      type: Boolean,
      default: true
    },
    quotes: {
      type: Boolean,
      default: false
    },
    callToAction: {
      type: Boolean,
      default: true
    },
    customInstructions: {
      type: String,
      maxlength: 500
    }
  },
  blogSettings: {
    wordpress: {
      siteUrl: String,
      username: String,
      password: String,
      apiKey: String,
      connected: {
        type: Boolean,
        default: false
      },
      connectedAt: Date
    },
    defaultPublishStatus: {
      type: String,
      enum: ['draft', 'private', 'publish'],
      default: 'draft'
    },
    autoAddImages: {
      type: Boolean,
      default: true
    },
    defaultImageSource: {
      type: String,
      enum: ['unsplash', 'pexels', 'random'],
      default: 'unsplash'
    }
  },
  preferences: {
    defaultNiche: {
      type: String,
      default: 'technology'
    },
    defaultWordCount: {
      type: Number,
      default: 1000,
      min: 300,
      max: 3000
    },
    defaultTone: {
      type: String,
      enum: ['professional', 'casual', 'friendly', 'authoritative'],
      default: 'professional'
    },
    language: {
      type: String,
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  stats: {
    articlesGenerated: {
      type: Number,
      default: 0
    },
    articlesPublished: {
      type: Number,
      default: 0
    },
    totalWordsWritten: {
      type: Number,
      default: 0
    },
    lastActivity: {
      type: Date,
      default: Date.now
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  emailVerified: {
    type: Boolean,
    default: false
  },
  verificationToken: String,
  resetPasswordToken: String,
  resetPasswordExpires: Date
}, {
  timestamps: true
});

// Index for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ username: 1 });
UserSchema.index({ 'blogSettings.wordpress.connected': 1 });

// Virtual for user's full profile
UserSchema.virtual('fullProfile').get(function() {
  return {
    id: this._id,
    username: this.username,
    email: this.email,
    writingStyle: this.writingStyle,
    blogSettings: this.blogSettings,
    preferences: this.preferences,
    stats: this.stats,
    createdAt: this.createdAt
  };
});

// Method to update user stats
UserSchema.methods.updateStats = function(articleWordCount, published = false) {
  this.stats.articlesGenerated += 1;
  this.stats.totalWordsWritten += articleWordCount;
  this.stats.lastActivity = new Date();
  
  if (published) {
    this.stats.articlesPublished += 1;
  }
  
  return this.save();
};

// Method to check if user has connected blog
UserSchema.methods.hasConnectedBlog = function() {
  return this.blogSettings?.wordpress?.connected || false;
};

// Method to get blog connection info
UserSchema.methods.getBlogInfo = function() {
  if (!this.hasConnectedBlog()) {
    return null;
  }
  
  return {
    siteUrl: this.blogSettings.wordpress.siteUrl,
    username: this.blogSettings.wordpress.username,
    connectedAt: this.blogSettings.wordpress.connectedAt
  };
};

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const bcrypt = require('bcryptjs');
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Static method to find user by email
UserSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find active users
UserSchema.statics.findActive = function() {
  return this.find({ isActive: true });
};

module.exports = mongoose.model('User', UserSchema); 