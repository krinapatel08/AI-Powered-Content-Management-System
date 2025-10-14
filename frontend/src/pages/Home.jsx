import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';
import { Link, useNavigate } from 'react-router-dom';

function Home() {
  const [articles, setArticles] = useState([]);
  const [user, setUser] = useState(null); // store current user info
  const navigate = useNavigate();

  useEffect(() => {
    fetchArticles();
    fetchUser();
  }, []);

  const fetchArticles = async () => {
    try {
      const res = await axiosInstance.get('articles/');
      setArticles(res.data);
    } catch (err) {
      console.error('Error fetching articles', err);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await axiosInstance.get('auth/me/'); // your backend endpoint to get current user
      setUser(res.data);
    } catch (err) {
      console.error('Error fetching user', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this article?')) return;
    try {
      await axiosInstance.delete(`articles/${id}/`);
      setArticles(articles.filter((a) => a.id !== id));
      alert('Article deleted!');
    } catch (err) {
      console.error(err);
      alert('Failed to delete article.');
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold text-center">All Articles</h1>
        <button
          onClick={() => navigate('/create')}
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Create Article
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.map((article) => (
          <div key={article.id} className="bg-white p-4 rounded shadow hover:shadow-lg transition relative">
            <h2 className="text-2xl font-semibold mb-2">{article.title}</h2>
            <p className="text-gray-600 mb-2">By {article.author}</p>
            <p className="mb-4">{article.summary || article.content.slice(0, 100)}...</p>
            <Link to={`/article/${article.id}`} className="text-blue-500 hover:underline mr-2">
              Read More
            </Link>

            {user && user.username === article.author && (
              <div className="mt-2">
                <button
                  onClick={() => navigate(`/edit/${article.id}`)}
                  className="bg-yellow-500 text-white px-2 py-1 rounded mr-2"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(article.id)}
                  className="bg-red-500 text-white px-2 py-1 rounded"
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Home;
