const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/topics/trending
// @desc    Get trending topics for a specific niche
// @access  Private
router.get('/trending', auth, async (req, res) => {
  try {
    const { niche, country = 'US', timeframe = '7d' } = req.query;

    if (!niche) {
      return res.status(400).json({ error: 'Niche parameter is required' });
    }

    const topics = await getTrendingTopics(niche, country, timeframe);
    
    res.json({
      success: true,
      niche,
      country,
      timeframe,
      topics
    });
  } catch (err) {
    console.error('Error fetching trending topics:', err);
    res.status(500).json({ error: 'Failed to fetch trending topics' });
  }
});

// @route   GET /api/topics/search
// @desc    Search for topics related to a keyword
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { keyword, niche, limit = 10 } = req.query;

    if (!keyword) {
      return res.status(400).json({ error: 'Keyword parameter is required' });
    }

    const topics = await searchTopics(keyword, niche, limit);
    
    res.json({
      success: true,
      keyword,
      niche,
      topics
    });
  } catch (err) {
    console.error('Error searching topics:', err);
    res.status(500).json({ error: 'Failed to search topics' });
  }
});

// @route   GET /api/topics/niches
// @desc    Get available niches/categories
// @access  Private
router.get('/niches', auth, async (req, res) => {
  try {
    const niches = [
      { id: 'technology', name: 'Technology', description: 'Latest tech trends and innovations' },
      { id: 'health', name: 'Health & Wellness', description: 'Health tips and medical news' },
      { id: 'business', name: 'Business & Finance', description: 'Business insights and financial news' },
      { id: 'lifestyle', name: 'Lifestyle', description: 'Lifestyle tips and trends' },
      { id: 'entertainment', name: 'Entertainment', description: 'Movies, music, and celebrity news' },
      { id: 'sports', name: 'Sports', description: 'Sports news and updates' },
      { id: 'education', name: 'Education', description: 'Educational content and learning tips' },
      { id: 'travel', name: 'Travel', description: 'Travel guides and destination tips' },
      { id: 'food', name: 'Food & Cooking', description: 'Recipes and culinary trends' },
      { id: 'fashion', name: 'Fashion & Beauty', description: 'Fashion trends and beauty tips' },
      { id: 'science', name: 'Science', description: 'Scientific discoveries and research' },
      { id: 'politics', name: 'Politics', description: 'Political news and analysis' }
    ];

    res.json({
      success: true,
      niches
    });
  } catch (err) {
    console.error('Error fetching niches:', err);
    res.status(500).json({ error: 'Failed to fetch niches' });
  }
});

// Helper function to get trending topics
async function getTrendingTopics(niche, country, timeframe) {
  const topics = [];

  try {
    // Method 1: Google Trends API (if available)
    if (process.env.GOOGLE_TRENDS_API_KEY) {
      const googleTrends = await getGoogleTrends(niche, country, timeframe);
      topics.push(...googleTrends);
    }

    // Method 2: News API
    if (process.env.NEWS_API_KEY) {
      const newsTopics = await getNewsTopics(niche, country);
      topics.push(...newsTopics);
    }

    // Method 3: Reddit API (for community-driven trends)
    const redditTopics = await getRedditTopics(niche);
    topics.push(...redditTopics);

    // Method 4: Twitter Trends (simulated)
    const twitterTopics = await getTwitterTopics(niche);
    topics.push(...twitterTopics);

    // Remove duplicates and sort by relevance
    const uniqueTopics = removeDuplicates(topics);
    return uniqueTopics.slice(0, 20); // Return top 20 topics

  } catch (error) {
    console.error('Error in getTrendingTopics:', error);
    // Return fallback topics based on niche
    return getFallbackTopics(niche);
  }
}

// Helper function to search topics
async function searchTopics(keyword, niche, limit) {
  try {
    const topics = [];

    // Search in news
    if (process.env.NEWS_API_KEY) {
      const newsResults = await searchNewsTopics(keyword, niche, limit);
      topics.push(...newsResults);
    }

    // Search in Reddit
    const redditResults = await searchRedditTopics(keyword, niche, limit);
    topics.push(...redditResults);

    return removeDuplicates(topics).slice(0, limit);
  } catch (error) {
    console.error('Error in searchTopics:', error);
    return [];
  }
}

// Google Trends API integration
async function getGoogleTrends(niche, country, timeframe) {
  try {
    // This would require Google Trends API access
    // For now, return simulated data
    return [
      {
        title: `${niche} trends 2024`,
        description: `Latest trends in ${niche} for 2024`,
        source: 'Google Trends',
        relevance: 0.9,
        searchVolume: 'high'
      }
    ];
  } catch (error) {
    console.error('Google Trends API error:', error);
    return [];
  }
}

// News API integration
async function getNewsTopics(niche, country) {
  try {
    const response = await axios.get(`https://newsapi.org/v2/top-headlines`, {
      params: {
        country: country.toLowerCase(),
        category: niche,
        apiKey: process.env.NEWS_API_KEY,
        pageSize: 10
      }
    });

    return response.data.articles.map(article => ({
      title: article.title,
      description: article.description,
      source: 'News API',
      url: article.url,
      relevance: 0.8,
      publishedAt: article.publishedAt
    }));
  } catch (error) {
    console.error('News API error:', error);
    return [];
  }
}

// Reddit API integration
async function getRedditTopics(niche) {
  try {
    const subreddits = {
      technology: ['technology', 'programming', 'gadgets'],
      health: ['health', 'fitness', 'nutrition'],
      business: ['business', 'entrepreneur', 'investing'],
      lifestyle: ['lifestyle', 'selfimprovement', 'productivity'],
      entertainment: ['entertainment', 'movies', 'music'],
      sports: ['sports', 'nba', 'soccer'],
      education: ['education', 'learnprogramming', 'science'],
      travel: ['travel', 'backpacking', 'digitalnomad'],
      food: ['food', 'cooking', 'recipes'],
      fashion: ['fashion', 'streetwear', 'beauty'],
      science: ['science', 'futurology', 'technology'],
      politics: ['politics', 'worldnews', 'news']
    };

    const relevantSubreddits = subreddits[niche] || [niche];
    
    // Simulate Reddit API call
    return [
      {
        title: `Top ${niche} discussions on Reddit`,
        description: `Community discussions about ${niche}`,
        source: 'Reddit',
        relevance: 0.7,
        subreddit: relevantSubreddits[0]
      }
    ];
  } catch (error) {
    console.error('Reddit API error:', error);
    return [];
  }
}

// Twitter Trends simulation
async function getTwitterTopics(niche) {
  try {
    return [
      {
        title: `#${niche} trending on Twitter`,
        description: `Latest ${niche} hashtags and discussions`,
        source: 'Twitter',
        relevance: 0.6,
        hashtag: `#${niche}`
      }
    ];
  } catch (error) {
    console.error('Twitter API error:', error);
    return [];
  }
}

// Search news topics
async function searchNewsTopics(keyword, niche, limit) {
  try {
    const response = await axios.get(`https://newsapi.org/v2/everything`, {
      params: {
        q: `${keyword} ${niche}`,
        apiKey: process.env.NEWS_API_KEY,
        pageSize: limit,
        sortBy: 'relevancy'
      }
    });

    return response.data.articles.map(article => ({
      title: article.title,
      description: article.description,
      source: 'News API',
      url: article.url,
      relevance: 0.8,
      publishedAt: article.publishedAt
    }));
  } catch (error) {
    console.error('News search error:', error);
    return [];
  }
}

// Search Reddit topics
async function searchRedditTopics(keyword, niche, limit) {
  try {
    return [
      {
        title: `Reddit discussions about ${keyword} in ${niche}`,
        description: `Community discussions and insights`,
        source: 'Reddit',
        relevance: 0.7,
        keyword
      }
    ];
  } catch (error) {
    console.error('Reddit search error:', error);
    return [];
  }
}

// Remove duplicate topics
function removeDuplicates(topics) {
  const seen = new Set();
  return topics.filter(topic => {
    const duplicate = seen.has(topic.title);
    seen.add(topic.title);
    return !duplicate;
  });
}

// Fallback topics when APIs fail
function getFallbackTopics(niche) {
  const fallbackTopics = {
    technology: [
      { title: 'Latest AI Developments', description: 'Recent advances in artificial intelligence', source: 'Fallback', relevance: 0.8 },
      { title: 'Cybersecurity Trends', description: 'Current cybersecurity challenges and solutions', source: 'Fallback', relevance: 0.7 }
    ],
    health: [
      { title: 'Mental Health Awareness', description: 'Importance of mental health in modern life', source: 'Fallback', relevance: 0.8 },
      { title: 'Nutrition Tips', description: 'Healthy eating habits and nutrition advice', source: 'Fallback', relevance: 0.7 }
    ],
    business: [
      { title: 'Remote Work Trends', description: 'The future of remote work and productivity', source: 'Fallback', relevance: 0.8 },
      { title: 'Digital Marketing Strategies', description: 'Effective digital marketing approaches', source: 'Fallback', relevance: 0.7 }
    ]
  };

  return fallbackTopics[niche] || [
    { title: `${niche} insights`, description: `Latest trends in ${niche}`, source: 'Fallback', relevance: 0.6 }
  ];
}

module.exports = router; 