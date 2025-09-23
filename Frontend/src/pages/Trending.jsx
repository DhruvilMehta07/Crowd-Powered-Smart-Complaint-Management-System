import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ThumbsUp, ArrowLeft } from "lucide-react";

export default function TrendingComplaints({ showViewMore = true }) {
  const [complaints, setComplaints] = useState([
    { id: 1, title: "Streetlight not working", upvotes: 12 },
    { id: 2, title: "Water leakage in main pipe", upvotes: 8 },
    { id: 3, title: "Garbage not collected", upvotes: 20 },
    { id: 4, title: "Broken speed breakers", upvotes: 5 },
    { id: 5, title: "Potholes on main road", upvotes: 30 },
  ]);
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
          <ArrowLeft size={20} />
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
              <ThumbsUp size={18} /> {c.upvotes}
            </button>
          </li>
        ))}
      </ul>

      {showViewMore && (
        <div className="mt-4 text-center">
          
        </div>
      )}
    </div>
  );
}
