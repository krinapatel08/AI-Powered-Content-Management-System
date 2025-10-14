import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';
import { useParams } from 'react-router-dom';

function ArticleDetail() {
  const { id } = useParams();
  const [article, setArticle] = useState({});
  const [aiResults, setAiResults] = useState({
    summary: '',
    seo: '',
    tags: [],
    sentiment: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchArticle();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const res = await axiosInstance.get(`articles/${id}/`);
      setArticle(res.data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || 'Failed to load article. Check server.'
      );
    }
  };

  const handleAIAction = async (feature) => {
    setLoading(true);
    setError('');
    try {
      const res = await axiosInstance.post(`articles/${id}/${feature}/`);
      const data = res.data;

      switch (feature) {
        case 'tags':
          setAiResults((prev) => ({ ...prev, tags: data.tags || [] }));
          break;
        case 'seo':
          setAiResults((prev) => ({ ...prev, seo: data.seo_suggestions || '' }));
          break;
        case 'summarize':
          setAiResults((prev) => ({ ...prev, summary: data.summary || '' }));
          break;
        case 'sentiment':
          setAiResults((prev) => ({ ...prev, sentiment: data.sentiment || '' }));
          break;
        default:
          break;
      }
    } catch (err) {
      console.error(err);
      if (err.response) {
        setError(err.response.data.error || 'Something went wrong on the server.');
      } else {
        setError('Network error. Is the backend running?');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4">
      {error && <p className="text-red-500 mb-4 font-semibold">{error}</p>}

      <h1 className="text-3xl font-bold mb-2">{article.title}</h1>
      <p className="text-gray-600 mb-4">By {article.author}</p>
      <p className="mb-4">{article.content}</p>

      <div className="flex flex-wrap gap-2 mb-4">
        {['summarize', 'seo', 'tags', 'sentiment'].map((feat) => (
          <button
            key={feat}
            onClick={() => handleAIAction(feat)}
            className={`px-4 py-2 rounded text-white ${
              feat === 'summarize'
                ? 'bg-blue-500'
                : feat === 'seo'
                ? 'bg-green-500'
                : feat === 'tags'
                ? 'bg-purple-500'
                : 'bg-yellow-500'
            }`}
            disabled={loading}
          >
            {feat === 'summarize'
              ? 'Summarize'
              : feat === 'seo'
              ? 'SEO Suggestions'
              : feat === 'tags'
              ? 'Generate Tags'
              : 'Sentiment Analysis'}
          </button>
        ))}
      </div>

      {/* Display AI Results */}
      {aiResults.summary && (
        <div className="p-4 border rounded bg-gray-100 mb-2">
          <h3 className="font-semibold mb-1">Summary:</h3>
          <p>{aiResults.summary}</p>
        </div>
      )}

      {aiResults.seo && (
        <div className="p-4 border rounded bg-gray-100 mb-2">
          <h3 className="font-semibold mb-1">SEO Suggestions:</h3>
          <p>{aiResults.seo}</p>
        </div>
      )}

      {aiResults.tags.length > 0 && (
        <div className="p-4 border rounded bg-gray-100 mb-2">
          <h3 className="font-semibold mb-1">Tags:</h3>
          <p>{aiResults.tags.join(', ')}</p>
        </div>
      )}

      {aiResults.sentiment && (
        <div className="p-4 border rounded bg-gray-100 mb-2">
          <h3 className="font-semibold mb-1">Sentiment:</h3>
          <p>{aiResults.sentiment}</p>
        </div>
      )}
    </div>
  );
}

export default ArticleDetail;
