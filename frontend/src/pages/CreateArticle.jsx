import React, { useState } from 'react';
import axiosInstance from '../api/axios';
import { useNavigate } from 'react-router-dom';

function CreateArticle() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    content: '',
  });
  const [aiTopic, setAiTopic] = useState('');
  const [aiGenerated, setAiGenerated] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Submit new article
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.post('articles/', formData);
      alert('Article created!');
      navigate('/');
    } catch  {
      setError('Error creating article');
    }
  };

  // Generate AI content based on topic
  const handleAIGenerate = async () => {
    if (!aiTopic) return alert('Enter a topic');
    try {
      const res = await axiosInstance.post('articles/generate/', { topic: aiTopic });
      setAiGenerated(res.data.content);
      setFormData({ ...formData, content: res.data.content });
    } catch (err) {
      console.error(err);
      setError('AI generation failed');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">Create Article</h1>

      {error && <p className="text-red-500 mb-2">{error}</p>}

      <div className="mb-4">
        <input
          type="text"
          name="title"
          placeholder="Article Title"
          value={formData.title}
          onChange={handleChange}
          className="w-full p-2 border rounded mb-2"
        />
      </div>

      <div className="mb-4">
        <textarea
          name="content"
          placeholder="Article Content"
          value={formData.content}
          onChange={handleChange}
          className="w-full p-2 border rounded mb-2 h-40"
        ></textarea>
      </div>

      <div className="mb-4">
        <input
          type="text"
          placeholder="Enter topic for AI generation"
          value={aiTopic}
          onChange={(e) => setAiTopic(e.target.value)}
          className="w-full p-2 border rounded mb-2"
        />
        <button
          onClick={handleAIGenerate}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Generate AI Content
        </button>
      </div>

      <button
        onClick={handleSubmit}
        className="bg-green-500 text-white px-4 py-2 rounded"
      >
        Submit Article
      </button>

      {aiGenerated && (
        <div className="p-4 border rounded bg-gray-100 mt-4">
          <h3 className="font-semibold mb-2">AI Generated Content:</h3>
          <p>{aiGenerated}</p>
        </div>
      )}
    </div>
  );
}

export default CreateArticle;
