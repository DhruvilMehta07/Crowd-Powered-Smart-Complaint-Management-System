// Notifications.jsx - Updated with matching theme
import React from "react";

export default function Notifications() {
  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border-2 border-indigo-100 p-8">
          <h1 className="text-3xl font-bold text-indigo-900 mb-4">Notifications</h1>
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">🔔</span>
            </div>
            <p className="text-gray-600 text-lg">No notifications yet.</p>
            <p className="text-gray-500 mt-2 text-sm">You'll be notified when there are updates on your complaints.</p>
          </div>
        </div>
      </div>
    </div>
  );
}