const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  content: {
    type: String,
    required: true
  },
  topic: {
    type: String,
    required: true,
    trim: true
  },
  niche: {
    type: String,
    required: true,
    enum: [
      'technology', 'health', 'business', 'lifestyle', 'entertainment',
      'sports', 'education', 'travel', 'food', 'fashion', 'science', 'politics'
    ]
  },
  writingStyle: {
    voice: {
      type: String,
      enum: ['professional', 'casual', 'friendly', 'authoritative', 'conversational']
    },
    complexity: {
      type: String,
      enum: ['simple', 'moderate', 'advanced']
    },
    structure: {
      type: String,
      enum: ['traditional', 'storytelling', 'list-based', 'question-answer']
    },
    examples: Boolean,
    quotes: Boolean,
    callToAction: Boolean,
    customInstructions: String
  },
  wordCount: {
    type: Number,
    required: true,
    min: 100
  },
  tone: {
    type: String,
    enum: ['professional', 'casual', 'friendly', 'authoritative'],
    default: 'professional'
  },
  status: {
    type: String,
    enum: ['draft', 'review', 'published', 'archived'],
    default: 'draft'
  },
  tags: [{
    type: String,
    trim: true
  }],
  keywords: [{
    type: String,
    trim: true
  }],
  seoData: {
    metaTitle: String,
    metaDescription: String,
    focusKeyword: String,
    readabilityScore: Number,
    seoScore: Number
  },
  images: [{
    url: String,
    alt: String,
    caption: String,
    position: Number,
    source: {
      type: String,
      enum: ['unsplash', 'pexels', 'uploaded']
    },
    photographer: String,
    photographerUrl: String
  }],
  blogPost: {
    postId: String,
    postUrl: String,
    publishedAt: Date,
    status: {
      type: String,
      enum: ['draft', 'private', 'publish'],
      default: 'draft'
    },
    featuredImage: {
      url: String,
      alt: String
    }
  },
  analytics: {
    views: {
      type: Number,
      default: 0
    },
    likes: {
      type: Number,
      default: 0
    },
    shares: {
      type: Number,
      default: 0
    },
    comments: {
      type: Number,
      default: 0
    }
  },
  generatedAt: {
    type: Date,
    default: Date.now
  },
  regeneratedAt: Date,
  publishedAt: Date,
  archivedAt: Date
}, {
  timestamps: true
});

// Indexes for better query performance
ArticleSchema.index({ userId: 1, createdAt: -1 });
ArticleSchema.index({ userId: 1, status: 1 });
ArticleSchema.index({ userId: 1, niche: 1 });
ArticleSchema.index({ 'blogPost.postId': 1 });
ArticleSchema.index({ generatedAt: -1 });

// Virtual for article summary
ArticleSchema.virtual('summary').get(function() {
  return {
    id: this._id,
    title: this.title,
    topic: this.topic,
    niche: this.niche,
    wordCount: this.wordCount,
    status: this.status,
    generatedAt: this.generatedAt,
    hasBlogPost: !!this.blogPost?.postId
  };
});

// Virtual for article content preview
ArticleSchema.virtual('contentPreview').get(function() {
  const maxLength = 200;
  if (this.content.length <= maxLength) {
    return this.content;
  }
  return this.content.substring(0, maxLength) + '...';
});

// Method to update article status
ArticleSchema.methods.updateStatus = function(newStatus) {
  this.status = newStatus;
  
  if (newStatus === 'published') {
    this.publishedAt = new Date();
  } else if (newStatus === 'archived') {
    this.archivedAt = new Date();
  }
  
  return this.save();
};

// Method to add image to article
ArticleSchema.methods.addImage = function(imageData) {
  const image = {
    url: imageData.url,
    alt: imageData.alt || '',
    caption: imageData.caption || '',
    position: this.images.length + 1,
    source: imageData.source || 'unsplash',
    photographer: imageData.photographer || '',
    photographerUrl: imageData.photographerUrl || ''
  };
  
  this.images.push(image);
  return this.save();
};

// Method to set featured image
ArticleSchema.methods.setFeaturedImage = function(imageUrl, alt = '') {
  if (!this.blogPost) {
    this.blogPost = {};
  }
  
  this.blogPost.featuredImage = {
    url: imageUrl,
    alt: alt
  };
  
  return this.save();
};

// Method to update blog post info
ArticleSchema.methods.updateBlogPost = function(postData) {
  if (!this.blogPost) {
    this.blogPost = {};
  }
  
  Object.assign(this.blogPost, postData);
  return this.save();
};

// Method to increment analytics
ArticleSchema.methods.incrementAnalytics = function(type, amount = 1) {
  if (this.analytics[type] !== undefined) {
    this.analytics[type] += amount;
    return this.save();
  }
  throw new Error(`Invalid analytics type: ${type}`);
};

// Static method to find articles by user
ArticleSchema.statics.findByUser = function(userId, options = {}) {
  const query = { userId };
  
  if (options.status) query.status = options.status;
  if (options.niche) query.niche = options.niche;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(options.limit || 10)
    .skip(options.skip || 0);
};

// Static method to find published articles
ArticleSchema.statics.findPublished = function(userId) {
  return this.find({ userId, status: 'published' })
    .sort({ publishedAt: -1 });
};

// Static method to get user stats
ArticleSchema.statics.getUserStats = async function(userId) {
  const stats = await this.aggregate([
    { $match: { userId: mongoose.Types.ObjectId(userId) } },
    {
      $group: {
        _id: null,
        totalArticles: { $sum: 1 },
        totalWords: { $sum: '$wordCount' },
        publishedArticles: {
          $sum: { $cond: [{ $eq: ['$status', 'published'] }, 1, 0] }
        },
        draftArticles: {
          $sum: { $cond: [{ $eq: ['$status', 'draft'] }, 1, 0] }
        },
        averageWordCount: { $avg: '$wordCount' }
      }
    }
  ]);
  
  return stats[0] || {
    totalArticles: 0,
    totalWords: 0,
    publishedArticles: 0,
    draftArticles: 0,
    averageWordCount: 0
  };
};

// Static method to find trending topics
ArticleSchema.statics.findTrendingTopics = function(userId, days = 7) {
  const dateLimit = new Date();
  dateLimit.setDate(dateLimit.getDate() - days);
  
  return this.aggregate([
    {
      $match: {
        userId: mongoose.Types.ObjectId(userId),
        generatedAt: { $gte: dateLimit }
      }
    },
    {
      $group: {
        _id: '$topic',
        count: { $sum: 1 },
        niches: { $addToSet: '$niche' }
      }
    },
    { $sort: { count: -1 } },
    { $limit: 10 }
  ]);
};

// Pre-save middleware to update word count
ArticleSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    this.wordCount = this.content.split(/\s+/).length;
  }
  next();
});

module.exports = mongoose.model('Article', ArticleSchema); 