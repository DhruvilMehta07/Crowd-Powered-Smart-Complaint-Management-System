import React from "react";
import ComplaintCard from "../components/ComplaintsCard";
import TrendingComplaints from "../components/Trending";

export default function Home() {
  const sample = [
    {
      id: 1,
      user: "Aisha",
      date: "2025-09-01",
      text: "Streetlight at 5th avenue is broken",
      assigned: "Maintenance Crew",
    },
    {
      id: 2,
      user: "Rohit",
      date: "2025-09-03",
      text: "Overflowing garbage near block C",
      assigned: "Sanitation Dept.",
    },
  ];

  return (
    <div className="flex-1 p-6 grid grid-cols-3 gap-6">
      <div className="col-span-2 space-y-4">
        <h1 className="text-2xl font-bold">Latest Complaints</h1>
        <div className="space-y-4">
          {sample.map((c) => (
            <ComplaintCard
              key={c.id}
              user={c.user}
              date={c.date}
              text={c.text}
              assigned={c.assigned}
              onUpvote={() => {}}
            />
          ))}
        </div>
      </div>

      <aside className="col-span-1">
        <TrendingComplaints showViewMore={false} />
      </aside>
    </div>
  );
}
