import React from "react";
import TrendingComplaints from "../components/Trending";

export default function TrendingPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Trending</h1>
      <TrendingComplaints showViewMore={false} />
    </div>
  );
}
