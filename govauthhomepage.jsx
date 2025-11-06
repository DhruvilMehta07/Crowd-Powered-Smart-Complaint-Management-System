  import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/axiosConfig';
import axios from 'axios';

// --- Icon Components (Keeping all your existing icons) ---

const SearchIcon = ({ className = 'w-6 h-6' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const FilterIcon = ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M2.628 1.601C5.028 1.206 7.49 1 10 1s4.973.206 7.372.601a.75.75 0 01.628.74v2.288a2.25 2.25 0 01-.659 1.59l-4.682 4.683a2.25 2.25 0 00-.659 1.59v3.037c0 .684-.31 1.33-.844 1.757l-1.937 1.55A.75.75 0 018 18.25v-5.757a2.25 2.25 0 00-.659-1.591L2.659 6.22A2.25 2.25 0 012 4.629V2.34a.75.75 0 01.628-.74z" clipRule="evenodd" />
  </svg>
);

const UserIcon = ({ className = 'w-12 h-12' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" clipRule="evenodd" />
  </svg>
);

const ThreeDotsIcon = ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path d="M10 3a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM10 8.5a1.5 1.5 0 110 3 1.5 1.5 0 010-3zM11.5 15.5a1.5 1.5 0 10-3 0 1.5 1.5 0 003 0z" />
  </svg>
);

// New/Modified Icons based on the second snippet

/* Removed upvote/comment/share icons and logic as requested. */



const ComplaintCard = ({ complaint, onAssignClick }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
      return new Date(complaint.posted_at || dateString).toLocaleDateString('en-GB', options);
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="bg-white p-4 rounded-xl border-indigo-100 shadow-md hover:shadow-xl transition-all duration-300 hover:border-indigo-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-1 text-indigo-600">
            <UserIcon className="w-10 h-10" />
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
            <p className="font-bold text-lg text-gray-800">
              {complaint.author || complaint.posted_by?.username || 'Anonymous User'}
            </p>
            <p className="text-sm text-gray-500 sm:pl-0">
              {formatDate(complaint.posted_at || complaint.date)}
            </p>
          </div>
        </div>
        <button className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-2 rounded-full transition-all duration-200">
          <ThreeDotsIcon />
        </button>
      </div>

      <p className="text-lg text-gray-800 mb-1">{complaint.content}</p>
      <p className="text-gray-600 text-base leading-relaxed mb-4">
        Address: {complaint.address}
      </p>

      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600 mb-4 bg-indigo-50 px-3 py-2 rounded-lg inline-block border border-indigo-200">
          <span className="font-semibold text-indigo-700">Assigned to:</span>{' '}
          <span className="text-gray-800">
            {complaint.assignedTo || complaint.assigned_to || complaint.category || 'Not assigned'}
          </span>
        </div>
        <button
          onClick={() => onAssignClick(complaint)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors duration-200"
        >
          Assign to Field Worker
        </button>
      </div>
    </div>
  );
};



const AssignModal = ({ isOpen, onClose, onAssign, complaint, fieldWorkers }) => {
  const [selectedWorker, setSelectedWorker] = useState('');

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-50"
      onClick={handleBackdropClick}
    >
      <div className="bg-white w-[100%] max-w-md rounded-2xl shadow-xl p-6 relative mx-4">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-[#4B687A] hover:text-[#AAAAAA] text-lg bg-white w-10 h-10 flex items-center justify-center rounded-full"
        >
          ✕
        </button>

        <h2 className="text-xl font-bold mb-4 text-[#4B687A]">Assign Complaint</h2>
        <p className="text-gray-600 mb-4">Select a field worker to assign this complaint:</p>

        <select
          value={selectedWorker}
          onChange={(e) => setSelectedWorker(e.target.value)}
          className="w-full p-3 border rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-[#4B687AD9]"
        >
          <option value="">Select a field worker</option>
          {fieldWorkers.map((worker) => (
            <option key={worker.id} value={worker.id}>
              {worker.username}
            </option>
          ))}
        </select>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              if (selectedWorker) {
                onAssign(selectedWorker);
              }
            }}
            disabled={!selectedWorker}
            className="px-4 py-2 bg-[#4B687A] text-white rounded-lg hover:bg-[#4B687AB5] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Assign
          </button>
        </div>
      </div>
    </div>
  );
};

const GovAuthHomepage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [fieldWorkers, setFieldWorkers] = useState([]);

  const [activeMenu, setActiveMenu] = useState('home');


  const fetchGovComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/complaints/govhome/')

      setComplaints(res.data || []);
    } catch (err) {
      console.error('Error loading gov complaints', err);
      setError('Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchComplaints = useCallback(async (q) => {
    if (!q) {
      return fetchGovComplaints();
    }
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/complaints/search/?q=${encodeURIComponent(q)}`);
      setComplaints(res.data || []);
    } catch (err) {
      console.error('Search error', err);
      setError('Search failed.');
    } finally {
      setLoading(false);
    }
  }, [fetchGovComplaints]);

  const fetchFieldWorkers = useCallback(async (complaintId) => {
    try {
      const endpoint = complaintId
        ? `/complaints/available-workers/${complaintId}/`
        : '/complaints/available-workers/';

      const res = await api.get(endpoint);
      setFieldWorkers(res.data || []);
    } catch (err) {
      console.error('Error loading field workers', err);
      setFieldWorkers([]);
    }
  }, []);

  const handleAssignClick = async (complaint) => {
  setSelectedComplaint(complaint);
  await fetchFieldWorkers(complaint.id); // fetch workers for this specific complaint
  setIsAssignModalOpen(true);
  };  

  const handleAssign = async (workerId) => {
    try {
      await api.post(`/complaints/assign/${selectedComplaint.id}/`, {
        fieldworker_id: workerId  // Match the backend expected field name
      });
      // Refresh the complaints list
      fetchGovComplaints();
      setIsAssignModalOpen(false);
      setSelectedComplaint(null);
    } catch (err) {
      console.error('Error assigning complaint', err);
      setError('Failed to assign complaint.');
    }
  };

  useEffect(() => {
    fetchGovComplaints();
    fetchFieldWorkers();
  }, [fetchGovComplaints, fetchFieldWorkers]);

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 font-inter min-h-screen flex flex-col">
      <header className="bg-white w-full p-4 flex justify-between items-center sticky top-0 z-10 border-b-3 border-indigo-400">
        <div className="flex-1 max-w-2xl mx-auto">
          <div className="relative">
            <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
            <input
              type="search"
              placeholder="Search complaints"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  searchComplaints(query);
                }
              }}
              className="w-full pl-12 pr-4 py-3 border-2 border-indigo-300 rounded-full bg-blue-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-indigo-400 transition-all"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button className="p-3 rounded-full hover:bg-indigo-100 hover:shadow-md transition-all duration-200">
            <FilterIcon className="w-6 h-6 text-indigo-600" />
          </button>
        </div>
      </header>

      <div className="flex-1 flex">
        <div className="flex-1 flex justify-center px-1 py-1">
          <div className="w-full max-w-2xl lg:max-w-4xl space-y-1">
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 text-center mb-6">
                <p className="text-red-700 font-semibold">{error}</p>
              </div>
            )}

            {!loading && complaints.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border-2 border-indigo-200 shadow-lg">
                <p className="text-gray-700 text-lg font-semibold">No complaints found.</p>
                <p className="text-gray-500 mt-2">Try adjusting your search or check back later.</p>
              </div>
            )}

            {!loading && complaints.map((complaint) => (
              <ComplaintCard 
                key={complaint.id} 
                complaint={complaint}
                onAssignClick={handleAssignClick}
              />
            ))}
          </div>
        </div>
      </div>

      <AssignModal
        isOpen={isAssignModalOpen}
        onClose={() => {
          setIsAssignModalOpen(false);
          setSelectedComplaint(null);
        }}
        onAssign={handleAssign}
        complaint={selectedComplaint}
        fieldWorkers={fieldWorkers}
      />
    </div>
  );
};

export default GovAuthHomepage;