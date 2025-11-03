import React, { useEffect, useState } from "react";
import axiosInstance from "../api/axios";
import { motion } from "framer-motion";

function Dashboard() {
  const [usageData, setUsageData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const res = await axiosInstance.get("usage/");
      setUsageData(res.data);
    } catch (err) {
      console.error("Error fetching AI usage", err);
    } finally {
      setLoading(false);
    }
  };

  const featureColors = {
    generate: "bg-purple-100 text-purple-800",
    summarize: "bg-blue-100 text-blue-800",
    seo: "bg-green-100 text-green-800",
    tags: "bg-yellow-100 text-yellow-800",
    sentiment: "bg-pink-100 text-pink-800",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-extrabold text-center mb-8 text-gray-800 dark:text-white">
          ⚙️ AI Usage Dashboard
        </h1>

        {loading ? (
          <div className="text-center text-gray-500 dark:text-gray-400 animate-pulse">
            Loading your data...
          </div>
        ) : usageData.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              🚀 No AI usage yet. Start generating content to see insights here!
            </p>
          </motion.div>
        ) : (
          <div className="overflow-x-auto bg-white dark:bg-gray-900 shadow-xl rounded-2xl border border-gray-100 dark:border-gray-700">
            <table className="min-w-full table-auto">
              <thead className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                <tr>
                  <th className="py-3 px-4 text-left">Feature</th>
                  <th className="py-3 px-4 text-left">Article</th>
                  <th className="py-3 px-4 text-center">Tokens Used</th>
                  <th className="py-3 px-4 text-center">Cost ($)</th>
                  <th className="py-3 px-4 text-center">Date</th>
                </tr>
              </thead>
              <tbody>
                {usageData.map((item, idx) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
                  >
                    <td className="py-3 px-4">
                      <span
                        className={`px-3 py-1 text-sm font-semibold rounded-full ${
                          featureColors[item.feature] || "bg-gray-100 text-gray-800"
                        }`}
                      >
                        {item.feature}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 dark:text-gray-300">
                      {item.article_title || "N/A"}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-700 dark:text-gray-300">
                      {item.tokens_used}
                    </td>
                    <td className="py-3 px-4 text-center font-semibold text-green-600 dark:text-green-400">
                      ${Number(item.estimated_cost).toFixed(4)}
                    </td>
                    <td className="py-3 px-4 text-center text-gray-500 dark:text-gray-400">
                      {new Date(item.created_at).toLocaleString()}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
