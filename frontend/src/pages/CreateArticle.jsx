import React, { useState } from "react";
import axiosInstance from "../api/axios";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, Loader2 } from "lucide-react";

function CreateArticle() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    tags: "",
  });

  const [aiTopic, setAiTopic] = useState("");
  const [aiTags, setAiTags] = useState([]);
  const [statusMsg, setStatusMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [articleCreated, setArticleCreated] = useState(false);

  // ---------------- Handle Input Change ----------------
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ---------------- Generate Blog (no auto-save) ----------------
  const handleAIGenerate = async () => {
    if (!aiTopic.trim()) return setStatusMsg("⚠️ Please enter a topic first!");
    setStatusMsg("");
    setLoading(true);

    try {
      const res = await axiosInstance.post("articles/generate/", { topic: aiTopic });
      const generatedContent = res.data.content || "";
      const tags = res.data.tags || [];

      setFormData({
        title: aiTopic,
        content: generatedContent,
        tags: tags.join(", "),
      });
      setAiTags(tags);
      setStatusMsg("✅ Blog generated successfully! Review and click Publish.");
    } catch (err) {
      console.error("❌ AI generation failed:", err.response?.data || err.message);
      setStatusMsg("❌ AI generation failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Manual Publish / Save ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatusMsg("");
    try {
      await axiosInstance.post("articles/", formData);
      setStatusMsg("✅ Article published successfully!");
      setArticleCreated(true);
      setTimeout(() => navigate("/dashboard"), 1500);
    } catch (err) {
      console.error(err);
      setStatusMsg("❌ Error saving article");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-purple-100 dark:from-gray-900 dark:to-gray-800 p-6 flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="max-w-3xl w-full bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-8 border border-purple-100 dark:border-gray-700"
      >
        <h1 className="text-3xl font-bold mb-6 text-purple-700 dark:text-purple-300 text-center">
          📝 Create a New Blog
        </h1>

        {/* Status message */}
        {statusMsg && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-center mb-4 p-2 rounded-lg text-sm font-medium ${
              statusMsg.includes("✅")
                ? "text-green-600 bg-green-100 dark:bg-green-800/30"
                : "text-red-600 bg-red-100 dark:bg-red-800/30"
            }`}
          >
            {statusMsg}
          </motion.p>
        )}

        {/* AI Topic Input */}
        <div className="flex flex-col sm:flex-row items-center gap-3 mb-6">
          <input
            type="text"
            placeholder="Enter a topic for AI to write about..."
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            className="flex-1 p-3 border border-purple-300 dark:border-purple-600 rounded-lg bg-purple-50 dark:bg-gray-800 text-gray-900 dark:text-white"
            disabled={loading}
          />
          <button
            onClick={handleAIGenerate}
            disabled={loading}
            className="flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white px-5 py-2.5 rounded-lg shadow-md transition-all"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Generating...
              </>
            ) : (
              "✨ Generate Blog"
            )}
          </button>
        </div>

        {/* Title */}
        <input
          type="text"
          name="title"
          placeholder="Enter blog title..."
          value={formData.title}
          onChange={handleChange}
          className="w-full p-3 border border-purple-300 dark:border-gray-600 rounded-lg mb-4 bg-purple-50 dark:bg-gray-800 text-gray-900 dark:text-white"
        />

        {/* Content */}
        <textarea
          name="content"
          placeholder="Write or edit your article..."
          value={formData.content}
          onChange={handleChange}
          className="w-full p-3 border border-purple-300 dark:border-gray-600 rounded-lg mb-6 bg-purple-50 dark:bg-gray-800 text-gray-900 dark:text-white h-64 resize-none"
        ></textarea>

        {/* Tags */}
        <div className="mb-6">
          <label className="block font-semibold mb-2 text-gray-700 dark:text-gray-300">
            🏷️ Tags
          </label>
          <input
            type="text"
            name="tags"
            placeholder="e.g. AI, Blogging, Tech"
            value={formData.tags}
            onChange={handleChange}
            className="w-full p-3 border border-purple-300 dark:border-gray-600 rounded-lg bg-purple-50 dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>

        {/* Publish Button */}
        {!articleCreated && (
          <button
            onClick={handleSubmit}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg shadow-lg transition-all"
          >
            🚀 Publish Article
          </button>
        )}

        {/* Related Tags Preview */}
        {aiTags.length > 0 && (
          <div className="mt-6">
            <h4 className="font-semibold text-purple-700 dark:text-purple-300 mb-2">
              🏷️ Related Tags
            </h4>
            <div className="flex flex-wrap gap-2">
              {aiTags.map((tag, idx) => (
                <span
                  key={idx}
                  className="bg-purple-100 dark:bg-purple-800 text-purple-700 dark:text-purple-200 px-3 py-1 rounded-full text-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Success icon when saved */}
        {articleCreated && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="flex items-center justify-center mt-8 text-green-600 dark:text-green-400 gap-2"
          >
            <CheckCircle className="w-6 h-6" />
            <p className="font-semibold">Article saved successfully!</p>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
}

export default CreateArticle;
