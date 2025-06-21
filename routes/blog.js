const express = require('express');
const axios = require('axios');
const auth = require('../middleware/auth');
const User = require('../models/User');
const Article = require('../models/Article');

const router = express.Router();

// @route   POST /api/blog/connect
// @desc    Connect to WordPress blog
// @access  Private
router.post('/connect', auth, async (req, res) => {
  try {
    const { siteUrl, username, password, apiKey } = req.body;

    if (!siteUrl || !username || (!password && !apiKey)) {
      return res.status(400).json({ error: 'Site URL, username, and password/API key are required' });
    }

    // Test the connection
    const connectionTest = await testWordPressConnection(siteUrl, username, password || apiKey);
    
    if (!connectionTest.success) {
      return res.status(400).json({ error: connectionTest.error });
    }

    // Save blog settings to user profile
    const user = await User.findById(req.user.id);
    user.blogSettings = {
      ...user.blogSettings,
      wordpress: {
        siteUrl,
        username,
        password: password || null,
        apiKey: apiKey || null,
        connected: true,
        connectedAt: new Date()
      }
    };

    await user.save();

    res.json({
      success: true,
      message: 'Blog connected successfully',
      blogInfo: connectionTest.blogInfo
    });

  } catch (err) {
    console.error('Error connecting to blog:', err);
    res.status(500).json({ error: 'Failed to connect to blog' });
  }
});

// @route   GET /api/blog/status
// @desc    Check blog connection status
// @access  Private
router.get('/status', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    const blogSettings = user.blogSettings?.wordpress;

    if (!blogSettings || !blogSettings.connected) {
      return res.json({
        connected: false,
        message: 'Blog not connected'
      });
    }

    // Test current connection
    const connectionTest = await testWordPressConnection(
      blogSettings.siteUrl,
      blogSettings.username,
      blogSettings.password || blogSettings.apiKey
    );

    res.json({
      connected: connectionTest.success,
      blogInfo: connectionTest.blogInfo,
      lastTested: new Date()
    });

  } catch (err) {
    console.error('Error checking blog status:', err);
    res.status(500).json({ error: 'Failed to check blog status' });
  }
});

// @route   POST /api/blog/post
// @desc    Post article to WordPress blog
// @access  Private
router.post('/post', auth, async (req, res) => {
  try {
    const { articleId, publishStatus = 'draft', featuredImage = null } = req.body;

    if (!articleId) {
      return res.status(400).json({ error: 'Article ID is required' });
    }

    // Get user and article
    const user = await User.findById(req.user.id);
    const article = await Article.findOne({ _id: articleId, userId: req.user.id });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (!user.blogSettings?.wordpress?.connected) {
      return res.status(400).json({ error: 'Blog not connected. Please connect your blog first.' });
    }

    // Post to WordPress
    const postResult = await postToWordPress({
      article,
      blogSettings: user.blogSettings.wordpress,
      publishStatus,
      featuredImage
    });

    if (!postResult.success) {
      return res.status(400).json({ error: postResult.error });
    }

    // Update article with blog post info
    article.blogPost = {
      postId: postResult.postId,
      postUrl: postResult.postUrl,
      publishedAt: new Date(),
      status: publishStatus
    };

    await article.save();

    res.json({
      success: true,
      message: 'Article posted successfully',
      postInfo: {
        postId: postResult.postId,
        postUrl: postResult.postUrl,
        status: publishStatus
      }
    });

  } catch (err) {
    console.error('Error posting to blog:', err);
    res.status(500).json({ error: 'Failed to post to blog' });
  }
});

// @route   GET /api/blog/posts
// @desc    Get posts from WordPress blog
// @access  Private
router.get('/posts', auth, async (req, res) => {
  try {
    const { page = 1, perPage = 10 } = req.query;

    const user = await User.findById(req.user.id);
    const blogSettings = user.blogSettings?.wordpress;

    if (!blogSettings || !blogSettings.connected) {
      return res.status(400).json({ error: 'Blog not connected' });
    }

    const posts = await getWordPressPosts(blogSettings, page, perPage);

    res.json({
      success: true,
      posts: posts.posts,
      total: posts.total,
      totalPages: posts.totalPages,
      currentPage: page
    });

  } catch (err) {
    console.error('Error fetching blog posts:', err);
    res.status(500).json({ error: 'Failed to fetch blog posts' });
  }
});

// @route   PUT /api/blog/post/:postId
// @desc    Update a blog post
// @access  Private
router.put('/post/:postId', auth, async (req, res) => {
  try {
    const { title, content, status, featuredImage } = req.body;
    const postId = req.params.postId;

    const user = await User.findById(req.user.id);
    const blogSettings = user.blogSettings?.wordpress;

    if (!blogSettings || !blogSettings.connected) {
      return res.status(400).json({ error: 'Blog not connected' });
    }

    const updateResult = await updateWordPressPost({
      postId,
      blogSettings,
      title,
      content,
      status,
      featuredImage
    });

    if (!updateResult.success) {
      return res.status(400).json({ error: updateResult.error });
    }

    res.json({
      success: true,
      message: 'Post updated successfully',
      postInfo: updateResult.postInfo
    });

  } catch (err) {
    console.error('Error updating blog post:', err);
    res.status(500).json({ error: 'Failed to update blog post' });
  }
});

// @route   DELETE /api/blog/post/:postId
// @desc    Delete a blog post
// @access  Private
router.delete('/post/:postId', auth, async (req, res) => {
  try {
    const postId = req.params.postId;

    const user = await User.findById(req.user.id);
    const blogSettings = user.blogSettings?.wordpress;

    if (!blogSettings || !blogSettings.connected) {
      return res.status(400).json({ error: 'Blog not connected' });
    }

    const deleteResult = await deleteWordPressPost(postId, blogSettings);

    if (!deleteResult.success) {
      return res.status(400).json({ error: deleteResult.error });
    }

    res.json({
      success: true,
      message: 'Post deleted successfully'
    });

  } catch (err) {
    console.error('Error deleting blog post:', err);
    res.status(500).json({ error: 'Failed to delete blog post' });
  }
});

// Helper function to test WordPress connection
async function testWordPressConnection(siteUrl, username, password) {
  try {
    // Remove trailing slash from site URL
    const cleanSiteUrl = siteUrl.replace(/\/$/, '');
    
    // Test using WordPress REST API
    const response = await axios.get(`${cleanSiteUrl}/wp-json/wp/v2/users/me`, {
      auth: {
        username,
        password
      },
      timeout: 10000
    });

    return {
      success: true,
      blogInfo: {
        siteUrl: cleanSiteUrl,
        siteName: response.data.name,
        userRole: response.data.roles?.[0] || 'unknown',
        capabilities: response.data.capabilities || {}
      }
    };

  } catch (error) {
    console.error('WordPress connection test failed:', error.response?.data || error.message);
    
    if (error.response?.status === 401) {
      return {
        success: false,
        error: 'Invalid credentials. Please check your username and password.'
      };
    } else if (error.response?.status === 404) {
      return {
        success: false,
        error: 'WordPress REST API not found. Please ensure your site has REST API enabled.'
      };
    } else {
      return {
        success: false,
        error: 'Failed to connect to WordPress site. Please check your site URL and credentials.'
      };
    }
  }
}

// Helper function to post to WordPress
async function postToWordPress({ article, blogSettings, publishStatus, featuredImage }) {
  try {
    const cleanSiteUrl = blogSettings.siteUrl.replace(/\/$/, '');
    
    const postData = {
      title: article.title,
      content: article.content,
      status: publishStatus,
      categories: [getCategoryId(article.niche)],
      tags: article.tags || []
    };

    if (featuredImage) {
      postData.featured_media = await uploadFeaturedImage(featuredImage, blogSettings);
    }

    const response = await axios.post(`${cleanSiteUrl}/wp-json/wp/v2/posts`, postData, {
      auth: {
        username: blogSettings.username,
        password: blogSettings.password || blogSettings.apiKey
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      postId: response.data.id,
      postUrl: response.data.link
    };

  } catch (error) {
    console.error('Error posting to WordPress:', error.response?.data || error.message);
    return {
      success: false,
      error: 'Failed to post to WordPress. Please check your credentials and try again.'
    };
  }
}

// Helper function to get WordPress posts
async function getWordPressPosts(blogSettings, page, perPage) {
  try {
    const cleanSiteUrl = blogSettings.siteUrl.replace(/\/$/, '');
    
    const response = await axios.get(`${cleanSiteUrl}/wp-json/wp/v2/posts`, {
      auth: {
        username: blogSettings.username,
        password: blogSettings.password || blogSettings.apiKey
      },
      params: {
        page,
        per_page: perPage,
        _embed: true
      }
    });

    const posts = response.data.map(post => ({
      id: post.id,
      title: post.title.rendered,
      content: post.content.rendered,
      excerpt: post.excerpt.rendered,
      status: post.status,
      date: post.date,
      link: post.link,
      featuredImage: post._embedded?.['wp:featuredmedia']?.[0]?.source_url || null
    }));

    const total = parseInt(response.headers['x-wp-total'] || '0');
    const totalPages = parseInt(response.headers['x-wp-totalpages'] || '0');

    return {
      posts,
      total,
      totalPages
    };

  } catch (error) {
    console.error('Error fetching WordPress posts:', error);
    throw new Error('Failed to fetch posts from WordPress');
  }
}

// Helper function to update WordPress post
async function updateWordPressPost({ postId, blogSettings, title, content, status, featuredImage }) {
  try {
    const cleanSiteUrl = blogSettings.siteUrl.replace(/\/$/, '');
    
    const updateData = {};
    if (title) updateData.title = title;
    if (content) updateData.content = content;
    if (status) updateData.status = status;

    if (featuredImage) {
      updateData.featured_media = await uploadFeaturedImage(featuredImage, blogSettings);
    }

    const response = await axios.put(`${cleanSiteUrl}/wp-json/wp/v2/posts/${postId}`, updateData, {
      auth: {
        username: blogSettings.username,
        password: blogSettings.password || blogSettings.apiKey
      },
      headers: {
        'Content-Type': 'application/json'
      }
    });

    return {
      success: true,
      postInfo: {
        id: response.data.id,
        title: response.data.title.rendered,
        status: response.data.status,
        link: response.data.link
      }
    };

  } catch (error) {
    console.error('Error updating WordPress post:', error);
    return {
      success: false,
      error: 'Failed to update WordPress post'
    };
  }
}

// Helper function to delete WordPress post
async function deleteWordPressPost(postId, blogSettings) {
  try {
    const cleanSiteUrl = blogSettings.siteUrl.replace(/\/$/, '');
    
    await axios.delete(`${cleanSiteUrl}/wp-json/wp/v2/posts/${postId}`, {
      auth: {
        username: blogSettings.username,
        password: blogSettings.password || blogSettings.apiKey
      }
    });

    return { success: true };

  } catch (error) {
    console.error('Error deleting WordPress post:', error);
    return {
      success: false,
      error: 'Failed to delete WordPress post'
    };
  }
}

// Helper function to upload featured image
async function uploadFeaturedImage(imageUrl, blogSettings) {
  try {
    const cleanSiteUrl = blogSettings.siteUrl.replace(/\/$/, '');
    
    // Download the image
    const imageResponse = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    
    // Upload to WordPress
    const formData = new FormData();
    formData.append('file', Buffer.from(imageResponse.data), {
      filename: 'featured-image.jpg',
      contentType: 'image/jpeg'
    });

    const uploadResponse = await axios.post(`${cleanSiteUrl}/wp-json/wp/v2/media`, formData, {
      auth: {
        username: blogSettings.username,
        password: blogSettings.password || blogSettings.apiKey
      },
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });

    return uploadResponse.data.id;

  } catch (error) {
    console.error('Error uploading featured image:', error);
    return null;
  }
}

// Helper function to get category ID based on niche
function getCategoryId(niche) {
  const categoryMap = {
    technology: 1,
    health: 2,
    business: 3,
    lifestyle: 4,
    entertainment: 5,
    sports: 6,
    education: 7,
    travel: 8,
    food: 9,
    fashion: 10,
    science: 11,
    politics: 12
  };

  return categoryMap[niche] || 1; // Default to technology category
}

module.exports = router; 