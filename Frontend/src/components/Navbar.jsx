import React from 'react'

const tabs = ["Citizen", "Government Authority", "Field Worker", "Administrator"]

function Navbar({ activeTab, setActiveTab }) {
  return (
    <div className="navbar">
      {tabs.map(tab => (
        <button
          key={tab}
          className={`nav-btn ${activeTab === tab ? "active" : ""}`}
          onClick={() => setActiveTab(tab)}
        >
          {tab}
        </button>
      ))}
    </div>
  )
}

export default Navbar
