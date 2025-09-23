import React, { useState } from "react";
import { Search, Filter } from "lucide-react";
import ComplaintCard from "../components/ComplaintCard";
import TrendingComplaints from "../components/Trending";

export default function Home() {
  const [complaints, setComplaints] = useState([
    {
      user: "Anonymous User",
      date: "15/09/2025",
      text: "Every day on my way to the office, I come across deep potholes...",
      assigned: "Road Department, Ward No. 3",
      upvotes: 4000,
    },
    {
      user: "Parth Bhatt",
      date: "07/09/2025",
      text: "Every morning and evening, the traffic congestion during office hours...",
      assigned: "Traffic Management Department, Ward No. 12",
      upvotes: 3200,
    },
    {
      user: "Anonymous User 2",
      date: "10/09/2025",
      text: "Water supply has not been coming for the last two days...",
      assigned: "Water Supply Department, Ward No. 8",
      upvotes: 2000,
    },
  ]);

  const handleUpvote = (index) => {
    const updated = [...complaints];
    updated[index].upvotes += 1;
    setComplaints(updated);
  };

  return (
    <div className="flex-1 flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center justify-between p-4 bg-white shadow-sm">
        <div className="flex items-center w-full max-w-lg bg-gray-100 rounded-full px-3 py-2">
          <Search size={20} className="text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Search"
            className="bg-transparent outline-none w-full"
          />
          <Filter size={20} className="text-gray-500" />
        </div>
        <button className="bg-slate-700 text-white px-4 py-1 rounded-lg ml-4">
          Login/SignUp
        </button>
      </div>

      {/* Content */}
      <div className="flex flex-1 gap-4 p-4">
        {/* Main complaints section - larger */}
        <div className="flex-[3] space-y-4">
          {complaints.map((c, i) => (
            <ComplaintCard
              key={i}
              user={c.user}
              date={c.date}
              text={c.text}
              assigned={c.assigned}
              onUpvote={() => handleUpvote(i)}
            />
          ))}
        </div>

        {/* Right sidebar - smaller */}
        <div className="flex-[1]">
          <TrendingComplaints complaints={complaints} />
        </div>
      </div>
    </div>
  );
}
