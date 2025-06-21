const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-app-name.herokuapp.com/api'
  : 'http://localhost:5000/api';

export const API_ENDPOINTS = {
  // Auth
  REGISTER: `${API_BASE_URL}/auth/register`,
  LOGIN: `${API_BASE_URL}/auth/login`,
  USER_PROFILE: `${API_BASE_URL}/auth/user`,
  UPDATE_PROFILE: `${API_BASE_URL}/auth/profile`,
  
  // Topics
  TRENDING_TOPICS: `${API_BASE_URL}/topics/trending`,
  SEARCH_TOPICS: `${API_BASE_URL}/topics/search`,
  NICHES: `${API_BASE_URL}/topics/niches`,
  
  // Articles
  GENERATE_ARTICLE: `${API_BASE_URL}/articles/generate`,
  GET_ARTICLES: `${API_BASE_URL}/articles`,
  GET_ARTICLE: (id) => `${API_BASE_URL}/articles/${id}`,
  UPDATE_ARTICLE: (id) => `${API_BASE_URL}/articles/${id}`,
  DELETE_ARTICLE: (id) => `${API_BASE_URL}/articles/${id}`,
  REGENERATE_ARTICLE: (id) => `${API_BASE_URL}/articles/${id}/regenerate`,
  
  // Images
  SEARCH_IMAGES: `${API_BASE_URL}/images/search`,
  TRENDING_IMAGES: `${API_BASE_URL}/images/trending`,
  RANDOM_IMAGES: `${API_BASE_URL}/images/random`,
  DOWNLOAD_IMAGE: `${API_BASE_URL}/images/download`,
  
  // Blog
  CONNECT_BLOG: `${API_BASE_URL}/blog/connect`,
  BLOG_STATUS: `${API_BASE_URL}/blog/status`,
  POST_TO_BLOG: `${API_BASE_URL}/blog/post`,
  GET_BLOG_POSTS: `${API_BASE_URL}/blog/posts`,
  UPDATE_BLOG_POST: (id) => `${API_BASE_URL}/blog/post/${id}`,
  DELETE_BLOG_POST: (id) => `${API_BASE_URL}/blog/post/${id}`,
  
  // Health check
  HEALTH: `${API_BASE_URL}/health`
};

export default API_ENDPOINTS; 