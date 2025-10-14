import React, { useState } from "react";
import { Link } from "react-router-dom";

export default function TrendingComplaints({ showViewMore = true }) {
  const trendingComplaints = [
        { text: "Struggling with potholes every day on the way to office, making travel unsafe and tiring.", upvotes: "4k Upvotes" },
        { text: "Stuck in long, stressful traffic jams during peak office hours.", upvotes: "3.2k Upvotes" },
        { text: "Facing a lot of difficulty as water hasn’t come for two days.", upvotes: "2k Upvotes" },
    ];
    

  

  return (

    <aside className="w-1/6 p-2 hidden lg:block">
            
            <div className="sticky top-20 space-y-4">
                <div className="bg-white p-5 rounded-lg border border-gray-200">
                    <h3 className="font-bold text-xl mb-4 text-slate-800">Trending Complaints</h3>
                    <div className="space-y-4">
                        {trendingComplaints.map((item, index) => (
                            <div key={index} className="text-sm">
                                <p className="text-gray-600">{item.text}</p>
                                <p className="font-bold text-slate-600 mt-1">{item.upvotes}</p>
                            </div>
                        ))}
                    </div>
                </div>

              
            </div>
        </aside>
  );
}
