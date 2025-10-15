import React, { useState, useEffect } from 'react';
import { Routes, Route } from "react-router-dom";
import axios from 'axios';
import Navbar from './components/Navbar';
import Login from './components/LoginForm'; // Import the main Login component with tabs
import Sidebar from './pages/SideBar';
import Home from './components/Home';
import Notifications from './pages/Notifications';
import PastComplaints from './pages/PastComplaints';
import Help from './pages/Help';
import RaiseComplaintModal from './pages/SideBar';
import Trending from './pages/TrendingComplaints';
import TrendingComplaints from './pages/TrendingComplaints';

function App() {
  const [activeTab, setActiveTab] = useState('Citizen');

  // Fetch CSRF token on app mount
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        await axios.get(
          `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:7000'}/users/csrf-token/`,
          { withCredentials: true }
        );
        console.log('CSRF token fetched successfully');
      } catch (error) {
        console.warn('Failed to fetch CSRF token:', error);
      }
    };

    fetchCsrfToken();
  }, []);

  // Auth Layout Component
  const AuthLayout = () => (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-4xl overflow-hidden">
        
        {/* Navigation Tabs */}
        <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
        
        {/* Login/Signup Content with Tabs */}
        <Login activeTab={activeTab} />
      </div>
    </div>
  );

  // Home Layout Component

  const HomeLayout = () => (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      {/* Main content area - takes remaining space */}
      <div className="flex-1 flex flex-col">
        <Routes>
          <Route index element={<Home />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="past-complaints" element={<PastComplaints />} />
          <Route path="help" element={<Help />} />
          <Route path="raise-complaint" element={<RaiseComplaintModal />} />
          <Route path="trending" element={<Trending />} />
        </Routes>
      </div>
      <TrendingComplaints/>
    </div>
  );

  return (
    <Routes>
      <Route path="/auth" element={<AuthLayout />} />
      <Route path="/" element={<HomeLayout />} />
    </Routes>
  );
}

export default App;