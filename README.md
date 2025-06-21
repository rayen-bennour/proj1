# AI Article Generator

A comprehensive web application that uses AI to generate human-like articles based on trending topics, with automatic blog integration and copyright-free image search.

## 🚀 Features

### Core Features
- **AI-Powered Article Generation**: Create engaging articles using OpenAI's GPT-4
- **Trending Topics Discovery**: Find hot topics in specific niches using multiple APIs
- **Custom Writing Styles**: Define your writing voice, complexity, and structure preferences
- **Blog Integration**: Connect and post directly to WordPress blogs
- **Copyright-Free Images**: Search and use images from Unsplash and Pexels
- **User Management**: Secure authentication and user profiles

### Advanced Features
- **Multi-Source Topic Research**: Google Trends, News API, Reddit, Twitter
- **Writing Style Templates**: Professional, casual, friendly, authoritative voices
- **SEO Optimization**: Built-in SEO analysis and meta tag generation
- **Article Management**: Draft, review, publish, and archive articles
- **Analytics Dashboard**: Track article performance and user statistics
- **Responsive Design**: Modern UI that works on all devices

## 🛠️ Tech Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **OpenAI API** for article generation
- **Multiple APIs**: News API, Unsplash, Pexels, WordPress REST API

### Frontend
- **React 18** with hooks
- **React Router** for navigation
- **React Query** for state management
- **Tailwind CSS** for styling
- **React Hook Form** for forms
- **React Hot Toast** for notifications

## 📋 Prerequisites

Before running this application, make sure you have:

- **Node.js** (v16 or higher)
- **MongoDB** (local or cloud instance)
- **npm** or **yarn** package manager
- API keys for the following services:
  - OpenAI API
  - News API (optional)
  - Unsplash API (optional)
  - Pexels API (optional)

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd ai-article-generator
```

### 2. Install Dependencies
```bash
# Install backend dependencies
npm install

# Install frontend dependencies
cd client
npm install
cd ..
```

### 3. Environment Configuration
Create a `.env` file in the root directory:
```bash
cp env.example .env
```

Fill in your environment variables:
```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/ai-article-generator

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# OpenAI API
OPENAI_API_KEY=your-openai-api-key-here

# Google Trends API (for trending topics)
GOOGLE_TRENDS_API_KEY=your-google-trends-api-key-here

# Unsplash API (for copyright-free images)
UNSPLASH_ACCESS_KEY=your-unsplash-access-key-here

# WordPress API (for blog integration)
WORDPRESS_SITE_URL=your-wordpress-site-url-here
WORDPRESS_USERNAME=your-wordpress-username
WORDPRESS_PASSWORD=your-wordpress-application-password

# Alternative APIs
NEWS_API_KEY=your-news-api-key-here
PEXELS_API_KEY=your-pexels-api-key-here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### 4. Database Setup
Make sure MongoDB is running. If using a local instance:
```bash
# Start MongoDB (if not already running)
mongod
```

### 5. Start the Application

#### Development Mode
```bash
# Start backend server
npm run dev

# In a new terminal, start frontend
npm run client
```

#### Production Mode
```bash
# Build frontend
npm run build

# Start production server
npm start
```

The application will be available at:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

## 📖 Usage Guide

### 1. User Registration
- Visit the application and create an account
- Set up your writing preferences and blog settings

### 2. Finding Trending Topics
- Navigate to "Topic Explorer"
- Select your niche (technology, health, business, etc.)
- Browse trending topics from multiple sources

### 3. Generating Articles
- Go to "Article Generator"
- Select a topic or enter your own
- Configure writing style preferences
- Set word count and tone
- Click "Generate Article"

### 4. Customizing Writing Style
Configure your preferred writing style:
- **Voice**: Professional, casual, friendly, authoritative
- **Complexity**: Simple, moderate, advanced
- **Structure**: Traditional, storytelling, list-based
- **Features**: Examples, quotes, call-to-action

### 5. Blog Integration
- Connect your WordPress blog in "Blog Settings"
- Provide your site URL and credentials
- Test the connection
- Post articles directly to your blog

### 6. Image Search
- Use "Image Search" to find copyright-free images
- Search by keywords or browse trending images
- Add images to your articles

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/user` - Get user profile
- `PUT /api/auth/profile` - Update user profile

### Topics
- `GET /api/topics/trending` - Get trending topics
- `GET /api/topics/search` - Search topics
- `GET /api/topics/niches` - Get available niches

### Articles
- `POST /api/articles/generate` - Generate article
- `GET /api/articles` - Get user articles
- `GET /api/articles/:id` - Get specific article
- `PUT /api/articles/:id` - Update article
- `DELETE /api/articles/:id` - Delete article
- `POST /api/articles/:id/regenerate` - Regenerate article

### Images
- `GET /api/images/search` - Search images
- `GET /api/images/trending` - Get trending images
- `GET /api/images/random` - Get random images
- `POST /api/images/download` - Save image info

### Blog
- `POST /api/blog/connect` - Connect WordPress blog
- `GET /api/blog/status` - Check connection status
- `POST /api/blog/post` - Post article to blog
- `GET /api/blog/posts` - Get blog posts
- `PUT /api/blog/post/:id` - Update blog post
- `DELETE /api/blog/post/:id` - Delete blog post

## 🎨 Customization

### Writing Styles
You can customize writing styles by modifying the `writingStyle` object in the User model and the prompt generation logic in `routes/articles.js`.

### API Integrations
Add new topic sources by extending the functions in `routes/topics.js`:
- Add new API endpoints
- Implement data parsing
- Update the aggregation logic

### UI Customization
The frontend uses Tailwind CSS for styling. You can customize:
- Color schemes in `tailwind.config.js`
- Component styles in `src/index.css`
- Layout components in `src/components/`

## 🔒 Security Features

- **JWT Authentication**: Secure token-based authentication
- **Password Hashing**: bcrypt for password security
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS Protection**: Configured CORS for security
- **Input Validation**: Comprehensive input validation
- **SQL Injection Protection**: MongoDB with parameterized queries
- **XSS Protection**: Security headers and input sanitization

## 📊 Performance Optimization

- **Database Indexing**: Optimized MongoDB indexes
- **Caching**: React Query for client-side caching
- **Lazy Loading**: Code splitting for better performance
- **Image Optimization**: Responsive images and lazy loading
- **API Rate Limiting**: Prevents server overload

## 🧪 Testing

```bash
# Run backend tests
npm test

# Run frontend tests
cd client
npm test
```

## 📦 Deployment

### Backend Deployment
1. Set up a MongoDB instance (MongoDB Atlas recommended)
2. Configure environment variables
3. Deploy to your preferred platform (Heroku, Vercel, AWS, etc.)

### Frontend Deployment
1. Build the application: `npm run build`
2. Deploy the `build` folder to your hosting platform
3. Configure the API endpoint in production

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Commit your changes: `git commit -am 'Add feature'`
4. Push to the branch: `git push origin feature-name`
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Issues](https://github.com/your-repo/issues) page
2. Create a new issue with detailed information
3. Include error logs and steps to reproduce

## 🔮 Roadmap

- [ ] Multi-language support
- [ ] Advanced SEO tools
- [ ] Social media integration
- [ ] Email newsletter integration
- [ ] Advanced analytics dashboard
- [ ] Team collaboration features
- [ ] API rate limit management
- [ ] Mobile app development

## 🙏 Acknowledgments

- OpenAI for providing the GPT-4 API
- Unsplash and Pexels for free image APIs
- News API for trending topics
- The React and Node.js communities

---

**Made with ❤️ for content creators everywhere** 