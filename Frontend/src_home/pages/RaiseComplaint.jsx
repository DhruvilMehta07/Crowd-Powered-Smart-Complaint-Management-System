import React, { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

export default function RaiseComplaint() {
  const [complaint, setComplaint] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    alert(`Complaint Submitted: ${complaint}`);
    setComplaint("");
  };

  return (
    <div className="flex-1 p-6">
      {/* Title with Back Arrow */}
      <div className="flex items-center gap-2 mb-4">
        <Link to="/" className="text-gray-600 hover:text-blue-600">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-xl font-bold">Raise a Complaint</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <textarea
          className="w-full p-3 border rounded-md"
          rows="5"
          placeholder="Enter your complaint here..."
          value={complaint}
          onChange={(e) => setComplaint(e.target.value)}
        />
        <button
          type="submit"
          className="bg-slate-700 text-white px-4 py-2 rounded-lg"
        >
          Submit
        </button>
      </form>
    </div>
  );
}
