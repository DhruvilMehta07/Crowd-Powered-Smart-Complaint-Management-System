import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function TrendingComplaints({ showViewMore = true }) {
  const [complaints, setComplaints] = useState([
    { id: 1, title: "Streetlight not working", upvotes: 12 },
    { id: 2, title: "Water leakage in main pipe", upvotes: 8 },
    { id: 3, title: "Garbage not collected", upvotes: 20 },
    { id: 4, title: "Broken speed breakers", upvotes: 5 },
    { id: 5, title: "Potholes on main road", upvotes: 30 },
  ]);

  // Handle Upvote
  const handleUpvote = (id) => {
    setComplaints((prev) =>
      prev.map((c) =>
        c.id === id ? { ...c, upvotes: c.upvotes + 1 } : c
      )
    );
  };

  return (
    <div className="bg-white shadow-lg rounded-xl p-4 w-full h-full overflow-y-auto">
      <div className="flex items-center gap-2 mb-4">
        <Link to="/" className="text-gray-600 hover:text-blue-600">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </Link>
        <h2 className="text-xl font-bold">Trending Complaints</h2>
      </div>

      <ul className="space-y-2">
        {complaints.map((c) => (
          <li
            key={c.id}
            className="p-3 border rounded-lg hover:bg-gray-50 flex justify-between items-center"
          >
            <span>{c.title}</span>

            {/* Upvote Button */}
            <button
              onClick={() => handleUpvote(c.id)}
              className="flex items-center gap-1 text-slate-600 hover:text-blue-600"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" className="w-5 h-5">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg> 
              {c.upvotes}
            </button>
          </li>
        ))}
      </ul>

      {showViewMore && (
        <div className="mt-4 text-center">
          <button className="bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700">
            View More
          </button>
        </div>
      )}
    </div>
  );
}
