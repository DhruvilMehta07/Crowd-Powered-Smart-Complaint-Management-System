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
    <div className="w-64 bg-white shadow p-4 flex flex-col">
      <Link
        to="raise-complaint"
        className="bg-slate-700 text-white py-2 px-4 rounded font-semibold mb-6 flex items-center justify-center gap-2"
      >
        + Raise Complaint
      </Link>

      <nav className="space-y-4">
        <Link to="." className="flex items-center gap-2 text-slate-700 font-medium">
          🏠 Home
        </Link>
        <Link to="notifications" className="flex items-center gap-2 text-slate-700">
          🔔 Notification
        </Link>
        <Link to="past-complaints" className="flex items-center gap-2 text-slate-700">
          📥 Past Complaints
        </Link>
        <Link to="help" className="flex items-center gap-2 text-slate-700">
          ❓ Help
        </Link>
      </nav>

      <div className="mt-auto">
        {!isAuth ? (
          <div className="space-y-2">
            <Link to="/" className="block text-blue-600 hover:underline">
              Login / Signup
            </Link>
          </div>
        ) : (
          <button
            onClick={handleLogout}
            className="w-full bg-red-500 text-white py-2 rounded mt-4"
          >
            Logout
          </button>
        )}
      </div>
    </div>
  );
}
