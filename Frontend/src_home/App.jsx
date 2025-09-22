import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Sidebar from "./components/SideBar";
import Home from "./pages/Home";
import Notifications from "./pages/Notifications";
import PastComplaints from "./pages/PastComplaints";
import Help from "./pages/Help";
import RaiseComplaint from "./pages/RaiseComplaint";
import Trending from "./pages/Trending";
function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100">
        <Sidebar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/past-complaints" element={<PastComplaints />} />
          <Route path="/help" element={<Help />} />
          <Route path="/raise-complaint" element={<RaiseComplaint />} />
          <Route path="/trending" element={<Trending />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
