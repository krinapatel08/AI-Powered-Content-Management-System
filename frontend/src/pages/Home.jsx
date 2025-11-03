import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';
import { Link, useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';


function Home() {
  const [articles, setArticles] = useState([]);
  const [user, setUser] = useState(null);
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
      const res = await axiosInstance.get('auth/me/');
      setUser(res.data);
    } catch (err) {
      console.error('Error fetching user', err);
    }
  };

const handleDelete = async (id) => {
  const confirmed = window.prompt("Type DELETE to confirm article removal:");
  if (confirmed !== "DELETE") return;

  try {
    await axiosInstance.delete(`articles/${id}/`);
    setArticles(articles.filter((a) => a.id !== id));
    alert("🗑️ Article deleted successfully!");
  } catch (err) {
    console.error(err);
    alert("❌ Failed to delete article. Please try again.");
  }
};




  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-800">📰 All Articles</h1>
        <button
          onClick={() => navigate('/create')}
          className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-5 py-2 rounded-lg shadow-md transition-transform hover:scale-105"
        >
          + Create Article
        </button>
      </div>

      {/* Articles Grid */}
      {articles.length === 0 ? (
        <p className="text-gray-500 text-center text-lg py-12">
          No articles yet. Start by creating one!
        </p>
      ) : (
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {articles.map((article) => (
            <div
              key={article.id}
              className="group bg-white border border-gray-200 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
            >
              <div className="p-6 flex-1">
                <h2 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {article.title}
                </h2>
                <p className="text-sm text-gray-500 mb-4">
                  By <span className="font-medium">{article.author}</span>
                </p>
                <div className="text-gray-700 text-base leading-relaxed line-clamp-5 prose prose-sm max-w-none">
  <ReactMarkdown>
    {article.summary ||
      (article.content?.length > 300
        ? article.content.slice(0, 300) + '...'
        : article.content)}
  </ReactMarkdown>
</div>

              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t bg-gray-50 flex justify-between items-center">
                <Link
                  to={`/article/${article.id}`}
                  className="text-blue-600 font-medium hover:underline"
                >
                  Read More →
                </Link>

                {user && user.username === article.author && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/edit/${article.id}`)}
                      className="text-yellow-600 hover:text-yellow-700 font-medium text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(article.id)}
                      className="text-red-600 hover:text-red-700 font-medium text-sm"
                    >
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Home;
