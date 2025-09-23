import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AuthApp from './App'
import HomeApp from '../src_home/App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<AuthApp />} />
        <Route path="/home/*" element={<HomeApp />} />
      </Routes>
    </Router>
  </React.StrictMode>
)
