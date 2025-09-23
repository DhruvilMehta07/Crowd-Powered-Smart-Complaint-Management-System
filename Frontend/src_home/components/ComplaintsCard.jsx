import React from "react";
import { ThumbsUp, MessageCircle, Share2 } from "lucide-react";

export default function ComplaintCard({ user, date, text, assigned, onUpvote }) {
  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex justify-between items-center mb-2">
        <span className="font-semibold">{user}</span>
        <span className="text-sm text-gray-500">{date}</span>
      </div>

      <p className="text-gray-700 mb-2">{text}</p>

      <p className="text-sm font-medium">
        Assigned to: <span className="text-gray-600">{assigned}</span>
      </p>

      {/* Action Buttons */}
      <div className="flex gap-6 mt-3 text-gray-600">
        <button
          onClick={onUpvote}
          className="flex items-center gap-1 hover:text-blue-600"
        >
          <ThumbsUp size={18} /> Upvote
        </button>

        <button className="flex items-center gap-1 hover:text-blue-600">
          <MessageCircle size={18} /> Comment
        </button>

        <button className="flex items-center gap-1 hover:text-blue-600">
          <Share2 size={18} /> Share
        </button>
      </div>
    </div>
  );
}
