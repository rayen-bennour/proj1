const express = require('express');
const OpenAI = require('openai');
const auth = require('../middleware/auth');
const Article = require('../models/Article');

const router = express.Router();

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// @route   POST /api/articles/generate
// @desc    Generate an article using AI
// @access  Private
router.post('/generate', auth, async (req, res) => {
  try {
    const { 
      topic, 
      niche, 
      writingStyle, 
      wordCount = 1000, 
      tone = 'professional',
      includeImages = true,
      customPrompt = ''
    } = req.body;

    if (!topic || !niche) {
      return res.status(400).json({ error: 'Topic and niche are required' });
    }

    // Get user's writing style preferences
    const user = await User.findById(req.user.id);
    const userWritingStyle = user.writingStyle || {};

    // Combine user preferences with request parameters
    const finalWritingStyle = {
      ...userWritingStyle,
      ...writingStyle
    };

    // Generate the article
    const article = await generateArticle({
      topic,
      niche,
      writingStyle: finalWritingStyle,
      wordCount,
      tone,
      customPrompt
    });

    // Save article to database
    const savedArticle = new Article({
      userId: req.user.id,
      title: article.title,
      content: article.content,
      topic,
      niche,
      writingStyle: finalWritingStyle,
      wordCount: article.wordCount,
      tone,
      status: 'draft',
      generatedAt: new Date()
    });

    await savedArticle.save();

    res.json({
      success: true,
      article: savedArticle,
      message: 'Article generated successfully'
    });

  } catch (err) {
    console.error('Error generating article:', err);
    res.status(500).json({ error: 'Failed to generate article' });
  }
});

// @route   PUT /api/articles/:id
// @desc    Update an article
// @access  Private
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, content, status } = req.body;
    const articleId = req.params.id;

    const article = await Article.findOne({ _id: articleId, userId: req.user.id });
    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (title) article.title = title;
    if (content) article.content = content;
    if (status) article.status = status;

    article.updatedAt = new Date();
    await article.save();

    res.json({
      success: true,
      article,
      message: 'Article updated successfully'
    });

  } catch (err) {
    console.error('Error updating article:', err);
    res.status(500).json({ error: 'Failed to update article' });
  }
});

// @route   GET /api/articles
// @desc    Get user's articles
// @access  Private
router.get('/', auth, async (req, res) => {
  try {
    const { status, niche, page = 1, limit = 10 } = req.query;
    
    const query = { userId: req.user.id };
    if (status) query.status = status;
    if (niche) query.niche = niche;

    const articles = await Article.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Article.countDocuments(query);

    res.json({
      success: true,
      articles,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });

  } catch (err) {
    console.error('Error fetching articles:', err);
    res.status(500).json({ error: 'Failed to fetch articles' });
  }
});

// @route   GET /api/articles/:id
// @desc    Get a specific article
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const article = await Article.findOne({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json({
      success: true,
      article
    });

  } catch (err) {
    console.error('Error fetching article:', err);
    res.status(500).json({ error: 'Failed to fetch article' });
  }
});

// @route   DELETE /api/articles/:id
// @desc    Delete an article
// @access  Private
router.delete('/:id', auth, async (req, res) => {
  try {
    const article = await Article.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.user.id 
    });

    if (!article) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json({
      success: true,
      message: 'Article deleted successfully'
    });

  } catch (err) {
    console.error('Error deleting article:', err);
    res.status(500).json({ error: 'Failed to delete article' });
  }
});

// @route   POST /api/articles/:id/regenerate
// @desc    Regenerate an article with different parameters
// @access  Private
router.post('/:id/regenerate', auth, async (req, res) => {
  try {
    const { writingStyle, wordCount, tone, customPrompt } = req.body;
    const articleId = req.params.id;

    const originalArticle = await Article.findOne({ 
      _id: articleId, 
      userId: req.user.id 
    });

    if (!originalArticle) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Generate new article with updated parameters
    const newArticle = await generateArticle({
      topic: originalArticle.topic,
      niche: originalArticle.niche,
      writingStyle: writingStyle || originalArticle.writingStyle,
      wordCount: wordCount || originalArticle.wordCount,
      tone: tone || originalArticle.tone,
      customPrompt
    });

    // Update the existing article
    originalArticle.title = newArticle.title;
    originalArticle.content = newArticle.content;
    originalArticle.writingStyle = writingStyle || originalArticle.writingStyle;
    originalArticle.wordCount = newArticle.wordCount;
    originalArticle.tone = tone || originalArticle.tone;
    originalArticle.updatedAt = new Date();
    originalArticle.regeneratedAt = new Date();

    await originalArticle.save();

    res.json({
      success: true,
      article: originalArticle,
      message: 'Article regenerated successfully'
    });

  } catch (err) {
    console.error('Error regenerating article:', err);
    res.status(500).json({ error: 'Failed to regenerate article' });
  }
});

// Helper function to generate article using OpenAI
async function generateArticle({ topic, niche, writingStyle, wordCount, tone, customPrompt }) {
  try {
    // Build the prompt based on user preferences
    const prompt = buildArticlePrompt({
      topic,
      niche,
      writingStyle,
      wordCount,
      tone,
      customPrompt
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are an expert content writer who creates engaging, well-researched articles. Write in a natural, human-like style that matches the user's preferences."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      max_tokens: Math.min(wordCount * 2, 4000), // Estimate tokens needed
      temperature: 0.7,
      top_p: 0.9,
      frequency_penalty: 0.1,
      presence_penalty: 0.1
    });

    const generatedContent = completion.choices[0].message.content;
    
    // Parse the generated content to extract title and body
    const { title, content } = parseGeneratedContent(generatedContent);
    
    // Count actual words
    const actualWordCount = content.split(/\s+/).length;

    return {
      title,
      content,
      wordCount: actualWordCount
    };

  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate article with AI');
  }
}

// Helper function to build the article prompt
function buildArticlePrompt({ topic, niche, writingStyle, wordCount, tone, customPrompt }) {
  let prompt = `Write a ${wordCount}-word article about "${topic}" in the ${niche} niche.`;

  // Add tone instructions
  if (tone) {
    prompt += `\n\nTone: Write in a ${tone} tone.`;
  }

  // Add writing style instructions
  if (writingStyle) {
    prompt += `\n\nWriting Style:`;
    if (writingStyle.voice) prompt += `\n- Voice: ${writingStyle.voice}`;
    if (writingStyle.complexity) prompt += `\n- Complexity: ${writingStyle.complexity}`;
    if (writingStyle.structure) prompt += `\n- Structure: ${writingStyle.structure}`;
    if (writingStyle.examples) prompt += `\n- Include examples: ${writingStyle.examples}`;
    if (writingStyle.quotes) prompt += `\n- Include quotes: ${writingStyle.quotes}`;
    if (writingStyle.callToAction) prompt += `\n- Call to action: ${writingStyle.callToAction}`;
  }

  // Add custom prompt if provided
  if (customPrompt) {
    prompt += `\n\nAdditional Instructions: ${customPrompt}`;
  }

  // Add formatting instructions
  prompt += `\n\nFormat the response as follows:
TITLE: [Your article title here]

CONTENT:
[Your article content here]

Make sure the content is engaging, informative, and well-structured with proper paragraphs, headings, and bullet points where appropriate.`;

  return prompt;
}

// Helper function to parse generated content
function parseGeneratedContent(content) {
  const lines = content.split('\n');
  let title = '';
  let articleContent = '';
  let isContent = false;

  for (const line of lines) {
    if (line.startsWith('TITLE:')) {
      title = line.replace('TITLE:', '').trim();
    } else if (line.startsWith('CONTENT:')) {
      isContent = true;
    } else if (isContent) {
      articleContent += line + '\n';
    }
  }

  // If no title/content markers found, use the first line as title
  if (!title && !articleContent) {
    const parts = content.split('\n\n');
    title = parts[0] || 'Generated Article';
    articleContent = parts.slice(1).join('\n\n') || content;
  }

  return {
    title: title || 'Generated Article',
    content: articleContent.trim() || content
  };
}

module.exports = router; 