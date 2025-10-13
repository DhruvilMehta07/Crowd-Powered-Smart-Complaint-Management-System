import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function Sidebar() {
  const navigate = useNavigate();
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const isAuthFlag = typeof window !== "undefined" ? localStorage.getItem("isAuthenticated") === "true" : false;
  const isAuth = !!token || isAuthFlag;

  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("isAuthenticated");
    } catch (e) {
      console.warn("Error removing auth items", e);
    }
    navigate("/");
  };

  return (
  <aside className="w-80 p-4 hidden md:block">
    <div className="sticky top-24 flex flex-col h-[calc(100vh-6rem)]">
      {/* Raise Complaint Button */}
      <Link
        to="raise-complaint"
        className="w-full bg-slate-700 text-white font-bold py-4 rounded-xl mb-6 hover:bg-slate-800 transition-colors duration-300 flex items-center justify-center gap-2"
      >
        + Raise Complaint
      </Link>

      {/* Navigation */}
      <nav className="flex-1">
        <ul className="space-y-1">
          <li>
            <Link
              to="."
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-lg font-medium hover:bg-gray-100 text-gray-700 transition-colors duration-200"
            >
              🏠 Home
            </Link>
          </li>
          <li>
            <Link
              to="notifications"
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-lg font-medium hover:bg-gray-100 text-gray-700 transition-colors duration-200"
            >
              🔔 Notifications
            </Link>
          </li>
          <li>
            <Link
              to="past-complaints"
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-lg font-medium hover:bg-gray-100 text-gray-700 transition-colors duration-200"
            >
              📥 Past Complaints
            </Link>
          </li>
          <li>
            <Link
              to="help"
              className="flex items-center gap-4 px-4 py-3 rounded-lg text-lg font-medium hover:bg-gray-100 text-gray-700 transition-colors duration-200"
            >
              ❓ Help
            </Link>
          </li>
        </ul>
      </nav>

      
      
    </div>
  </aside>
);
}