import React, { useState, useEffect, useCallback } from 'react';
import api from '../utils/axiosConfig';

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

const UpvoteIcon = ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.03 9.83a.75.75 0 01-1.06-1.06l5.25-5.25a.75.75 0 011.06 0l5.25 5.25a.75.75 0 11-1.06 1.06L10.75 5.612V16.25a.75.75 0 01-.75.75z" clipRule="evenodd" />
  </svg>
);

const CommentIcon = ({ className = 'w-5 h-5' }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className={className}>
    <path fillRule="evenodd" d="M10 2c-2.236 0-4.43.18-6.57.524C1.993 2.755 1 4.014 1 5.426v5.148c0 1.413.993 2.67 2.43 2.902.848.137 1.705.248 2.57.331v3.443a.75.75 0 001.28.53l3.58-3.579a.78.78 0 01.527-.224 41.202 41.202 0 005.183-.5c1.437-.232 2.43-1.49 2.43-2.903V5.426c0-1.413-.993-2.67-2.43-2.902A41.289 41.289 0 0010 2zm0 7a1 1 0 100-2 1 1 0 000 2zM8 8a1 1 0 11-2 0 1 1 0 012 0zm5 1a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
  </svg>
);

const ComplaintCard = ({ complaint }) => {
  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-GB', options);
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="bg-blue-50 p-6 rounded-xl border-2 border-indigo-200 hover:shadow-xl hover:border-indigo-300 hover:-translate-y-1 transition-all duration-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-full p-1">
            <UserIcon className="w-10 h-10 text-gray-600" />
          </div>
          <div>
            <p className="font-bold text-lg text-gray-900">{complaint.posted_by?.username || 'Anonymous'}</p>
            <p className="text-sm text-gray-600">{formatDate(complaint.posted_at)}</p>
          </div>
        </div>
        <button className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 p-2 rounded-full transition-all duration-200">
          <ThreeDotsIcon />
        </button>
      </div>

      <p className="text-gray-800 text-base leading-relaxed mb-4">{complaint.content}</p>

      <div className="text-sm text-gray-700 mb-4 bg-white px-3 py-2 rounded-lg inline-block border border-indigo-200">
        <span className="font-semibold">Assigned to:</span> {complaint.assigned_to?.name || complaint.assigned_to || 'Unassigned'}
      </div>

      <div className="flex items-center gap-4 pt-4 border-t-2 border-indigo-200">
        <button className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 hover:scale-110 transition-all duration-200">
          <UpvoteIcon />
        </button>
        <button className="flex items-center gap-2 text-gray-700 hover:text-indigo-600 hover:scale-110 transition-all duration-200">
          <CommentIcon />
        </button>
      </div>
    </div>
  );
};

const FieldWorkerHomepage = () => {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');

  const fetchFieldComplaints = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/complaints/fieldhome/',{},{withCredentials: true});
      setComplaints(res.data || []);
    } catch (err) {
      console.error('Error loading field complaints', err);
      setError('Failed to load complaints.');
    } finally {
      setLoading(false);
    }
  }, []);

  const searchComplaints = useCallback(async (q) => {
    if (!q) {
      return fetchFieldComplaints();
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
  }, [fetchFieldComplaints]);

  useEffect(() => {
    fetchFieldComplaints();
  }, [fetchFieldComplaints]);

  return (
    <div className="flex h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 border-r-4 border-indigo-400">
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b-4 border-indigo-400 p-4">
          <div className="flex items-center gap-4">
            <div className="flex-1 relative">
              <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
              <input
                type="search"
                placeholder="Search complaints"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); searchComplaints(query); } }}
                className="w-full pl-12 pr-4 py-3 border-2 border-indigo-300 rounded-full bg-blue-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-indigo-400 transition-all duration-200"
              />
            </div>
            <button className="p-3 rounded-full hover:bg-indigo-100 hover:shadow-md transition-all duration-200">
              <FilterIcon className="w-6 h-6 text-indigo-600" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl space-y-6">
            {loading && (
              <div className="flex justify-center py-12">
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

            
          </div>
        </div>
      </main>
    </div>
  );
};

export default FieldWorkerHomepage;
