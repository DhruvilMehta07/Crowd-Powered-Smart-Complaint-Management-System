// Help.jsx - Updated with matching theme
import React from "react";

export default function Help() {
  return (
    <div className="p-6 bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border-2 border-indigo-100 p-8">
          <h1 className="text-3xl font-bold text-indigo-900 mb-4">Help & Support</h1>
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-4xl">❓</span>
            </div>
            <p className="text-gray-600 text-lg mb-4">How can we help you?</p>
            <p className="text-gray-500 text-sm">Contact support or browse our FAQ section.</p>
            <button className="mt-6 bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-3 px-6 rounded-lg hover:from-indigo-700 hover:to-blue-700 transition-all shadow-lg font-semibold">
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}