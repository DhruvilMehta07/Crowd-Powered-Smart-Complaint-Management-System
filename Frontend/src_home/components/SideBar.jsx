import React from "react";
import { Bell, Home, HelpCircle, Inbox, PlusCircle } from "lucide-react";
import { Link } from "react-router-dom";

export default function Sidebar() {
  return (
    <div className="w-64 bg-white shadow-md p-4 flex flex-col">
      <Link
        to="/raise-complaint"
        className="bg-slate-700 text-white py-2 px-4 rounded-lg font-semibold mb-6 flex items-center justify-center gap-2"
      >
        <PlusCircle size={18} /> Raise Complaint
      </Link>

      <nav className="space-y-4">
        <Link to="/" className="flex items-center gap-2 text-slate-700 font-medium">
          <Home size={20} /> Home
        </Link>
        <Link to="/notifications" className="flex items-center gap-2 text-slate-700">
          <Bell size={20} /> Notification
        </Link>
        <Link to="/past-complaints" className="flex items-center gap-2 text-slate-700">
          <Inbox size={20} /> Past Complaints
        </Link>
        <Link to="/help" className="flex items-center gap-2 text-slate-700">
          <HelpCircle size={20} /> Help
        </Link>
      </nav>
    </div>
  );
}
