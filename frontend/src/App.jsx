import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ArticleDetail from './pages/ArticleDetail';
import CreateArticle from './pages/CreateArticle';

function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen">
        <Navbar />
        <div className="flex-grow">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/article/:id" element={<ArticleDetail />} />
            <Route path="/create" element={<CreateArticle />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}

export default App;
