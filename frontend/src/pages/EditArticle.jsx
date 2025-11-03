import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axiosInstance from "../api/axios";

function EditArticle() {
  const { id } = useParams(); // article ID from URL
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchArticle();
  }, []);

  const fetchArticle = async () => {
    try {
      const res = await axiosInstance.get(`articles/${id}/`);
      setTitle(res.data.title);
      setContent(res.data.content);
    } catch (err) {
      console.error("Error fetching article:", err);
      alert("Failed to load article details.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      await axiosInstance.put(`articles/${id}/`, { title, content });
      alert("✅ Article updated successfully!");
      navigate(`/article/${id}`); // redirect to article details page
    } catch (err) {
      console.error("Error updating article:", err);
      alert("❌ Failed to update article. Please try again.");
    }
  };

  if (loading) return <p className="text-center py-10 text-gray-500">Loading...</p>;

  return (
    <div className="max-w-3xl mx-auto mt-10 p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">✏️ Edit Article</h1>

      <form onSubmit={handleUpdate}>
        <div className="mb-5">
          <label className="block text-gray-700 font-medium mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring focus:ring-blue-300"
            required
          />
        </div>

        <div className="mb-5">
          <label className="block text-gray-700 font-medium mb-2">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows="10"
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring focus:ring-blue-300"
            required
          />
        </div>

        <div className="flex justify-between items-center">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="bg-gray-400 hover:bg-gray-500 text-white px-5 py-2 rounded-lg"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg"
          >
            Update Article
          </button>
        </div>
      </form>
    </div>
  );
}

export default EditArticle;
