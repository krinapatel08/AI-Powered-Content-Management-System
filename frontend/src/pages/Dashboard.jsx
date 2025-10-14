import React, { useEffect, useState } from 'react';
import axiosInstance from '../api/axios';

function Dashboard() {
  const [usageData, setUsageData] = useState([]);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const res = await axiosInstance.get('usage/');
      setUsageData(res.data);
    } catch (err) {
      console.error('Error fetching AI usage', err);
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold mb-4">AI Usage Dashboard</h1>

      {usageData.length === 0 ? (
        <p>No AI usage yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border border-gray-300">
            <thead className="bg-gray-200">
              <tr>
                <th className="py-2 px-4 border">Feature</th>
                <th className="py-2 px-4 border">Article</th>
                <th className="py-2 px-4 border">Tokens Used</th>
                <th className="py-2 px-4 border">Estimated Cost ($)</th>
                <th className="py-2 px-4 border">Date</th>
              </tr>
            </thead>
            <tbody>
              {usageData.map((item) => (
                <tr key={item.id} className="text-center">
                  <td className="py-2 px-4 border">{item.feature}</td>
                  <td className="py-2 px-4 border">{item.article ? item.article.title : 'N/A'}</td>
                  <td className="py-2 px-4 border">{item.tokens_used}</td>
                  <td className="py-2 px-4 border">{item.estimated_cost}</td>
                  <td className="py-2 px-4 border">{new Date(item.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Dashboard;
