import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ThumbsUp } from "lucide-react";

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
      {/* Outer Box Title */}
      <h2 className="text-xl font-bold mb-4 border-b pb-2">
        Trending Complaints
      </h2>

      {/* Complaints inside their own mini-boxes */}
      <div className="space-y-3">
        {complaints.map((c) => (
          <div
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
          </div>
        ))}
      </div>

      {/* View More Button */}
      {showViewMore && (
        <div className="mt-4 text-center">
          <Link
            to="/trending"
            className="text-blue-600 font-medium hover:underline"
          >
            View More →
          </Link>
        </div>
      )}
    </div>
  );
}