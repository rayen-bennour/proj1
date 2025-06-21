const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/images/search
// @desc    Search for copyright-free images
// @access  Private
router.get('/search', auth, async (req, res) => {
  try {
    const { 
      query, 
      niche, 
      page = 1, 
      perPage = 20,
      orientation = 'landscape',
      color = null
    } = req.query;

    if (!query && !niche) {
      return res.status(400).json({ error: 'Query or niche parameter is required' });
    }

    const searchQuery = query || niche;
    const images = await searchImages({
      query: searchQuery,
      page,
      perPage,
      orientation,
      color
    });

    res.json({
      success: true,
      query: searchQuery,
      images,
      page,
      perPage
    });

  } catch (err) {
    console.error('Error searching images:', err);
    res.status(500).json({ error: 'Failed to search images' });
  }
});

// @route   GET /api/images/trending
// @desc    Get trending images for a niche
// @access  Private
router.get('/trending', auth, async (req, res) => {
  try {
    const { niche, limit = 10 } = req.query;

    if (!niche) {
      return res.status(400).json({ error: 'Niche parameter is required' });
    }

    const images = await getTrendingImages(niche, limit);

    res.json({
      success: true,
      niche,
      images
    });

  } catch (err) {
    console.error('Error fetching trending images:', err);
    res.status(500).json({ error: 'Failed to fetch trending images' });
  }
});

// @route   GET /api/images/random
// @desc    Get random images for a topic
// @access  Private
router.get('/random', auth, async (req, res) => {
  try {
    const { topic, count = 5 } = req.query;

    if (!topic) {
      return res.status(400).json({ error: 'Topic parameter is required' });
    }

    const images = await getRandomImages(topic, count);

    res.json({
      success: true,
      topic,
      images
    });

  } catch (err) {
    console.error('Error fetching random images:', err);
    res.status(500).json({ error: 'Failed to fetch random images' });
  }
});

// @route   POST /api/images/download
// @desc    Download and save image information
// @access  Private
router.post('/download', auth, async (req, res) => {
  try {
    const { imageUrl, imageData, articleId } = req.body;

    if (!imageUrl || !imageData) {
      return res.status(400).json({ error: 'Image URL and data are required' });
    }

    // Save image information to database (you can create an Image model)
    const imageInfo = {
      userId: req.user.id,
      articleId: articleId || null,
      url: imageUrl,
      data: imageData,
      downloadedAt: new Date()
    };

    // Here you would save to database
    // const savedImage = await Image.create(imageInfo);

    res.json({
      success: true,
      message: 'Image information saved',
      imageInfo
    });

  } catch (err) {
    console.error('Error saving image:', err);
    res.status(500).json({ error: 'Failed to save image' });
  }
});

// Helper function to search images from multiple sources
async function searchImages({ query, page, perPage, orientation, color }) {
  const images = [];

  try {
    // Search Unsplash
    if (process.env.UNSPLASH_ACCESS_KEY) {
      const unsplashImages = await searchUnsplash(query, page, perPage, orientation, color);
      images.push(...unsplashImages);
    }

    // Search Pexels
    if (process.env.PEXELS_API_KEY) {
      const pexelsImages = await searchPexels(query, page, perPage, orientation, color);
      images.push(...pexelsImages);
    }

    // Remove duplicates and sort by relevance
    const uniqueImages = removeDuplicateImages(images);
    return uniqueImages.slice(0, perPage);

  } catch (error) {
    console.error('Error in searchImages:', error);
    return getFallbackImages(query);
  }
}

// Unsplash API integration
async function searchUnsplash(query, page, perPage, orientation, color) {
  try {
    const params = {
      query,
      page,
      per_page: perPage,
      orientation
    };

    if (color) {
      params.color = color;
    }

    const response = await axios.get('https://api.unsplash.com/search/photos', {
      params,
      headers: {
        'Authorization': `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}`
      }
    });

    return response.data.results.map(photo => ({
      id: photo.id,
      url: photo.urls.regular,
      thumbUrl: photo.urls.thumb,
      downloadUrl: photo.links.download,
      alt: photo.alt_description || query,
      photographer: photo.user.name,
      photographerUrl: photo.user.links.html,
      width: photo.width,
      height: photo.height,
      source: 'Unsplash',
      license: 'Free to use',
      tags: photo.tags.map(tag => tag.title)
    }));

  } catch (error) {
    console.error('Unsplash API error:', error);
    return [];
  }
}

// Pexels API integration
async function searchPexels(query, page, perPage, orientation, color) {
  try {
    const params = {
      query,
      page,
      per_page: perPage
    };

    if (orientation) {
      params.orientation = orientation;
    }

    const response = await axios.get('https://api.pexels.com/v1/search', {
      params,
      headers: {
        'Authorization': process.env.PEXELS_API_KEY
      }
    });

    return response.data.photos.map(photo => ({
      id: photo.id,
      url: photo.src.large,
      thumbUrl: photo.src.medium,
      downloadUrl: photo.src.original,
      alt: photo.alt || query,
      photographer: photo.photographer,
      photographerUrl: photo.photographer_url,
      width: photo.width,
      height: photo.height,
      source: 'Pexels',
      license: 'Free to use',
      tags: []
    }));

  } catch (error) {
    console.error('Pexels API error:', error);
    return [];
  }
}

// Get trending images for a niche
async function getTrendingImages(niche, limit) {
  try {
    const trendingQueries = {
      technology: ['laptop', 'smartphone', 'coding', 'artificial intelligence'],
      health: ['fitness', 'healthy food', 'meditation', 'workout'],
      business: ['office', 'meeting', 'entrepreneur', 'startup'],
      lifestyle: ['lifestyle', 'wellness', 'productivity', 'mindfulness'],
      entertainment: ['movie', 'music', 'concert', 'celebrity'],
      sports: ['sports', 'fitness', 'athlete', 'competition'],
      education: ['study', 'books', 'learning', 'classroom'],
      travel: ['travel', 'landscape', 'adventure', 'destination'],
      food: ['food', 'cooking', 'restaurant', 'recipe'],
      fashion: ['fashion', 'style', 'clothing', 'accessories'],
      science: ['science', 'laboratory', 'research', 'technology'],
      politics: ['politics', 'government', 'election', 'protest']
    };

    const queries = trendingQueries[niche] || [niche];
    const images = [];

    for (const query of queries.slice(0, 3)) {
      const queryImages = await searchImages({
        query,
        page: 1,
        perPage: Math.ceil(limit / 3),
        orientation: 'landscape'
      });
      images.push(...queryImages);
    }

    return images.slice(0, limit);

  } catch (error) {
    console.error('Error in getTrendingImages:', error);
    return getFallbackImages(niche);
  }
}

// Get random images for a topic
async function getRandomImages(topic, count) {
  try {
    const images = await searchImages({
      query: topic,
      page: Math.floor(Math.random() * 10) + 1, // Random page
      perPage: count * 2, // Get more to ensure variety
      orientation: 'landscape'
    });

    // Shuffle and return requested count
    return shuffleArray(images).slice(0, count);

  } catch (error) {
    console.error('Error in getRandomImages:', error);
    return getFallbackImages(topic);
  }
}

// Remove duplicate images
function removeDuplicateImages(images) {
  const seen = new Set();
  return images.filter(image => {
    const duplicate = seen.has(image.url);
    seen.add(image.url);
    return !duplicate;
  });
}

// Shuffle array
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Fallback images when APIs fail
function getFallbackImages(query) {
  return [
    {
      id: 'fallback-1',
      url: `https://via.placeholder.com/800x600/4A90E2/FFFFFF?text=${encodeURIComponent(query)}`,
      thumbUrl: `https://via.placeholder.com/300x200/4A90E2/FFFFFF?text=${encodeURIComponent(query)}`,
      downloadUrl: `https://via.placeholder.com/800x600/4A90E2/FFFFFF?text=${encodeURIComponent(query)}`,
      alt: query,
      photographer: 'Placeholder',
      photographerUrl: '#',
      width: 800,
      height: 600,
      source: 'Placeholder',
      license: 'Free to use',
      tags: [query]
    },
    {
      id: 'fallback-2',
      url: `https://via.placeholder.com/800x600/50C878/FFFFFF?text=${encodeURIComponent(query)}`,
      thumbUrl: `https://via.placeholder.com/300x200/50C878/FFFFFF?text=${encodeURIComponent(query)}`,
      downloadUrl: `https://via.placeholder.com/800x600/50C878/FFFFFF?text=${encodeURIComponent(query)}`,
      alt: query,
      photographer: 'Placeholder',
      photographerUrl: '#',
      width: 800,
      height: 600,
      source: 'Placeholder',
      license: 'Free to use',
      tags: [query]
    }
  ];
}

module.exports = router; 