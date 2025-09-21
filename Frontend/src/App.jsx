import React, { useState } from 'react';
import Navbar from './components/Navbar';
import Login from './components/Login';
import './App.css'; 
// Import component-specific styles here for reliability
import './components/Login.css';

function App() {
  const [activeTab, setActiveTab] = useState('Administrator');

  return (
    // The className is now handled by App.css
    <div className="auth-wrapper">
         <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />
      <Login activeTab={activeTab} />
    </div>
  );
}

export default App;

