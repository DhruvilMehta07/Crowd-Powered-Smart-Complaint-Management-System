import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import axios, { Axios } from 'axios';
import Navbar from './components/Navbar';
import Login from './components/LoginForm';
import Sidebar from './pages/SideBar';
import Home from './components/Home';
import Notifications from './pages/Notifications';
import PastComplaints from './pages/PastComplaints';
import Help from './pages/Help';
import Profile from './pages/Profile';
import RaiseComplaintModal from './pages/SideBar';
import Trending from './pages/TrendingComplaints';
import TrendingComplaints from './pages/TrendingComplaints';
import api from './utils/axiosConfig';
import { setAccessToken } from './utils/auth';
import GovAuthHomepage from './components/govauthhomepage';
import FieldWorkerHomepage from './components/fieldworkerhomepage';
import ComplaintDetailView from './components/ComplaintDetailView';

function App() {
  const [activeTab, setActiveTab] = useState('Citizen');
  const [userType, setUserType] = useState();
  const [isLoading, setIsLoading] = useState(true);

  // Fetch CSRF token and check user type on app mount
  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Ensure CSRF cookie is set for subsequent POST/PUT/DELETE calls
        await api.get('/users/csrf/');

        // Restore access token from localStorage into in-memory helper
        const storedAccess = localStorage.getItem('access_token');
        if (storedAccess) setAccessToken(storedAccess);

        // Check if user is logged in and get user type
        const storedUserType = localStorage.getItem('user_type');
        const accessToken = storedAccess;
        if (storedUserType && accessToken) {
          setUserType(storedUserType);
        }
      } catch (error) {
        console.warn('Failed to initialize app (CSRF or tokens):', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeApp();
  }, []);

  // Auth Layout Component
  const AuthLayout = () => (
    <div className="min-h-screen w-full">
      <Login activeTab={activeTab} onLoginSuccess={handleLoginSuccess} />
    </div>
  );

  // Handle successful login
  const handleLoginSuccess = (userData) => {
    // Determine user type based on username or additional API call
    // You may need to modify your backend to return user_type in login response
    const type = determineUserType(userData);
    setUserType(type);
    localStorage.setItem('user_type', type);
  };

  // Determine user type (you may need to adjust this based on your backend response)
  const determineUserType = (userData) => {
    // Option 1: If your backend returns user_type in login response
    if (userData.user_type) {
      return userData.user_type;
    }
    
    // Option 2: Make an additional API call to get user details
    // Option 3: Check against multiple user tables (as you have in views.py)
    // For now, defaulting to 'citizen' - you should implement proper detection
    return userData.userType || 'citizen';
  };

  // Citizen Home Layout
  const CitizenHomeLayout = () => (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
  <div className="flex-1 flex flex-col overflow-auto scrollbar-hide">
        <Routes>
          <Route index element={<Home />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="past-complaints" element={<PastComplaints />} />
          <Route path="help" element={<Help />} />
          <Route path="raise-complaint" element={<RaiseComplaintModal />} />
          <Route path="trending" element={<Trending />} />
          <Route path="complaint/:id" element={<ComplaintDetailView />} />
        </Routes>
      </div>
      <TrendingComplaints/>
    </div>
  );

  // Government Authority Home Layout
  const GovAuthHomeLayout = () => (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
  <div className="flex-1 flex flex-col overflow-auto scrollbar-hide">
        <Routes>
          <Route index element={<GovAuthHomepage/>} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="past-complaints" element={<PastComplaints />} />
          <Route path="help" element={<Help />} />
          <Route path="raise-complaint" element={<RaiseComplaintModal />} />
          <Route path="trending" element={<Trending />} />
          <Route path="complaint/:id" element={<ComplaintDetailView />} />
        </Routes>
      </div>
      <TrendingComplaints/>
    </div>
      
      
    
  );

  // Field Worker Home Layout
  const FieldWorkerHomeLayout = () => (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
  <div className="flex-1 flex flex-col overflow-auto scrollbar-hide">
        <Routes>
          <Route index element={<FieldWorkerHomepage />} />
          <Route path="profile" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="help" element={<Help />} />
          <Route path='past-complaints' element={<PastComplaints/>} />
          <Route path="complaint/:id" element={<ComplaintDetailView />} />
          {/* Add field worker specific routes */}
        </Routes>
      </div>
      <TrendingComplaints/>
    </div>
  );

  // Home Route that renders based on user type
  const HomeRoute = () => {
    const ut = localStorage.getItem('user_type');
    switch(ut) {
      case 'authority':
        return <GovAuthHomeLayout />;
      case 'citizen':
        return <CitizenHomeLayout />;
      case 'fieldworker':
        return <FieldWorkerHomeLayout />;
      default:
        return <CitizenHomeLayout />;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/auth" element={<AuthLayout />} />
      <Route 
        path="*" 
        element={
          <HomeRoute />
        } 
      />
    </Routes>
  );
}

export default App;
