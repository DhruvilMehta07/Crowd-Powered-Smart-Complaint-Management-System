import React, { useState } from 'react';
import { Routes, Route } from "react-router-dom";
import Navbar from './components/Navbar';
import Login from './components/Login';
import Sidebar from './pages/SideBar';
import Home from './components/Home';
import Notifications from './pages/Notifications';
import PastComplaints from './pages/PastComplaints';
import Help from './pages/Help';
import RaiseComplaint from './pages/RaiseComplaint';
import TrendingComplaints from './pages/TrendingComplaints';

function App() {
  const [activeTab, setActiveTab] = useState('Citizen');

  // Auth Layout Component
  const AuthLayout = () => (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl overflow-hidden">
        {/* Dark Header */}
        <div className="bg-gray-800 flex items-center px-6 py-4 text-gray-300">
          <h1 className="text-xl font-semibold">Complaint Management System</h1>
        </div>
        
        {/* Navigation Tabs */}
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {/* Login/Signup Content */}
        <Login activeTab={activeTab} />
      </div>
    </div>
  );

  // Home Layout Component
  const HomeLayout = () => (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <Routes>
        <Route index element={<Home />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="past-complaints" element={<PastComplaints />} />
        <Route path="help" element={<Help />} />
        <Route path="raise-complaint" element={<RaiseComplaint />} />
        
      </Routes>
      <TrendingComplaints />
    </div>
  );

  return (
    <Routes>
      <Route path="/" element={<AuthLayout />} />
      <Route path="/home/*" element={<HomeLayout />} />
      
    </Routes>
  );
}

export default App;