import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Login from './pages/Login';
import Register from './pages/Register';
import ArticleGenerator from './pages/ArticleGenerator';
import ArticleEditor from './pages/ArticleEditor';
import ArticleList from './pages/ArticleList';
import BlogSettings from './pages/BlogSettings';
import Profile from './pages/Profile';
import ImageSearch from './pages/ImageSearch';
import TopicExplorer from './pages/TopicExplorer';
import LoadingSpinner from './components/LoadingSpinner';

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return user ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return user ? <Navigate to="/dashboard" replace /> : children;
};

function App() {
  return (
    <>
      <Helmet>
        <title>AI Article Generator - Create, Generate, and Publish Content</title>
        <meta name="description" content="AI-powered article generator with blog integration. Create engaging content, find trending topics, and publish to your blog automatically." />
        <meta name="keywords" content="AI, article generator, content creation, blog, WordPress, automation" />
        <meta name="author" content="AI Article Generator" />
        <meta property="og:title" content="AI Article Generator" />
        <meta property="og:description" content="Create engaging content with AI and publish to your blog automatically" />
        <meta property="og:type" content="website" />
        <meta property="og:url" content={window.location.origin} />
        <link rel="canonical" href={window.location.origin} />
      </Helmet>
      
      <Routes>
        {/* Public Routes */}
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        
        {/* Protected Routes */}
        <Route path="/" element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="generate" element={<ArticleGenerator />} />
          <Route path="articles" element={<ArticleList />} />
          <Route path="articles/:id" element={<ArticleEditor />} />
          <Route path="topics" element={<TopicExplorer />} />
          <Route path="images" element={<ImageSearch />} />
          <Route path="blog" element={<BlogSettings />} />
          <Route path="profile" element={<Profile />} />
        </Route>
        
        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </>
  );
}

export default App; 