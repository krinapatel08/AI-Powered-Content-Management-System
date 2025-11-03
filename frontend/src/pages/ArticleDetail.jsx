import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import { useParams, useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

function ArticleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [article, setArticle] = useState({});
  const [user, setUser] = useState(null);
  const [aiResults, setAiResults] = useState({
    summary: "",
    sentiment: "",
  });
  const [loadingFeature, setLoadingFeature] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    fetchArticle();
    fetchUser();
  }, [id]);

  const fetchArticle = async () => {
    try {
      const res = await axiosInstance.get(`articles/${id}/`);
      setArticle(res.data);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data?.detail || "Failed to load article. Check server."
      );
    }
  };

  const fetchUser = async () => {
    try {
      const res = await axiosInstance.get("auth/me/");
      setUser(res.data);
    } catch (err) {
      setUser(null); // not logged in
    }
  };

  const handleAIAction = async (feature) => {
    if (!user) {
      // ✅ Show login message and redirect
      setError("Please login first to use AI features.");
      setTimeout(() => navigate("/login"), 1500);
      return;
    }

    setLoadingFeature(feature);
    setError("");
    try {
      const res = await axiosInstance.post(`articles/${id}/${feature}/`, {
        content: article.content || "",
      });
      const data = res.data;

      if (feature === "summarize") {
        setAiResults((prev) => ({ ...prev, summary: data.summary || "" }));
      } else if (feature === "sentiment") {
        setAiResults((prev) => ({ ...prev, sentiment: data.sentiment || "" }));
      }
    } catch (err) {
      console.error(err);
      if (err.response) {
        setError(err.response.data.error || "Something went wrong on the server.");
      } else {
        setError("Network error. Is the backend running?");
      }
    } finally {
      setLoadingFeature("");
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      {error && (
        <p className="text-red-500 mb-4 font-semibold bg-red-50 p-3 rounded">
          {error}
        </p>
      )}

      <h1 className="text-4xl font-bold mb-2 text-gray-900">
        {article.title}
      </h1>
      <p className="text-gray-600 mb-6">By {article.author}</p>

      <div className="prose prose-lg max-w-none mb-8 text-gray-800">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
          {article.content || ""}
        </ReactMarkdown>
      </div>

      {/* 🧠 Summarize + 💬 Sentiment buttons */}
      <div className="flex flex-wrap gap-3 mb-6">
        <button
          onClick={() => handleAIAction("summarize")}
          className={`px-4 py-2 rounded text-white font-medium shadow ${
            loadingFeature === "summarize"
              ? "bg-blue-400"
              : "bg-blue-600 hover:bg-blue-700"
          }`}
          disabled={loadingFeature === "summarize"}
        >
          {loadingFeature === "summarize" ? "Processing..." : "🧠 Summarize"}
        </button>

        <button
          onClick={() => handleAIAction("sentiment")}
          className={`px-4 py-2 rounded text-white font-medium shadow ${
            loadingFeature === "sentiment"
              ? "bg-yellow-400"
              : "bg-yellow-500 hover:bg-yellow-600"
          }`}
          disabled={loadingFeature === "sentiment"}
        >
          {loadingFeature === "sentiment"
            ? "Processing..."
            : "💬 Sentiment Analysis"}
        </button>
      </div>

      {/* 🧾 Summary Output */}
      {aiResults.summary && (
        <div className="p-4 border rounded bg-gray-50 mb-4 prose max-w-none">
          <h3 className="font-semibold mb-2 text-lg">🧾 Summary:</h3>
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {aiResults.summary}
          </ReactMarkdown>
        </div>
      )}

      {/* 💬 Sentiment Output */}
      {aiResults.sentiment && (
        <div className="p-4 border rounded bg-gray-50 mb-4">
          <h3 className="font-semibold mb-2 text-lg">💬 Sentiment:</h3>
          <p
            className={`font-medium ${
              aiResults.sentiment.toLowerCase().includes("positive")
                ? "text-green-600"
                : aiResults.sentiment.toLowerCase().includes("negative")
                ? "text-red-600"
                : "text-yellow-600"
            }`}
          >
            {aiResults.sentiment}
          </p>
        </div>
      )}
    </div>
  );
}

export default ArticleDetail;
