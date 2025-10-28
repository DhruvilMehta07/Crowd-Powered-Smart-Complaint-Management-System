import React from "react";

export default function TrendingComplaints({ showViewMore = true }) {
  const trendingComplaints = [
    { text: "Struggling with potholes every day on the way to office, making travel unsafe and tiring.", upvotes: "4k Upvotes" },
    { text: "Stuck in long, stressful traffic jams during peak office hours.", upvotes: "3.2k Upvotes" },
    { text: "Facing a lot of difficulty as water hasn't come for two days.", upvotes: "2k Upvotes" },
  ];

  return (
    <aside className="w-1/6 p-2 hidden lg:block">
  <div className="sticky top-20 space-y-4 border-2 border-indigo-400 rounded-lg">
    {/* Updated Card Styling */}
    <div className="bg-white p-5 rounded-xl">
      {/* Updated Title Styling */}
      <h3 className="font-bold text-xl mb-4 text-indigo-900">
        Trending Complaints
      </h3>
      <div className="space-y-4">
        {trendingComplaints.map((item, index) => (
          // Updated List Item Styling
          <div
            key={index}
            className="text-sm hover:bg-indigo-50 p-3 rounded-lg transition-all cursor-pointer"
          >
            {/* Updated Text Styling */}
            <p className="text-gray-700">{item.text}</p>
            {/* Updated Upvotes Styling */}
            <p className="font-bold text-indigo-600 mt-1">{item.upvotes}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
</aside>

  );
}