import React, { useCallback, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import TrendingComplaints from '../pages/TrendingComplaints';
import { clearAccessToken } from '../utils/auth';
import { logoutUser } from '../services/api';

const SearchIcon = ({ className = 'w-6 h-6' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);

const UserIcon = ({ className = 'w-12 h-12' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M18.685 19.097A9.723 9.723 0 0021.75 12c0-5.385-4.365-9.75-9.75-9.75S2.25 6.615 2.25 12a9.723 9.723 0 003.065 7.097A9.716 9.716 0 0012 21.75a9.716 9.716 0 006.685-2.653zm-12.54-1.285A7.486 7.486 0 0112 15a7.486 7.486 0 015.855 2.812A8.224 8.224 0 0112 20.25a8.224 8.224 0 01-5.855-2.438zM15.75 9a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z"
      clipRule="evenodd"
    />
  </svg>
);

const ArrowUpIcon = ({ className = 'w-5 h-5', filled = false }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M10 17a.75.75 0 01-.75-.75V5.612L5.03 9.83a.75.75 0 01-1.06-1.06l5.25-5.25a.75.75 0 011.06 0l5.25 5.25a.75.75 0 11-1.06 1.06L10.75 5.612V16.25a.75.75 0 01-.75.75z"
      clipRule="evenodd"
    />
  </svg>
);

const ChatBubbleIcon = ({ className = 'w-5 h-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M10 2a8 8 0 100 16 8 8 0 000-16zM2 10a8 8 0 1116 0 8 8 0 01-16 0zm5.25-1.25a.75.75 0 000 1.5h5.5a.75.75 0 000-1.5h-5.5z"
      clipRule="evenodd"
    />
  </svg>
);

const ShareIcon = ({ className = 'w-5 h-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 20 20"
    fill="currentColor"
    className={className}
  >
    <path d="M13 4.5a2.5 2.5 0 11.702 4.289l-4.117 2.428a2.503 2.503 0 010 1.566l4.117 2.428A2.5 2.5 0 1113 15.5V4.5z" />
  </svg>
);

const Header = () => (
  <header className="bg-white w-full p-4 flex justify-between items-center sticky top-0 z-10 border-b-3 border-indigo-400">
    <div className="flex-1 max-w-2xl mx-auto">
      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-indigo-400" />
        <input
          type="search"
          placeholder="Search for complaints, people, or keywords"
          className="w-full pl-12 pr-4 py-3 border-2 border-indigo-200 rounded-full bg-indigo-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all"
        />
      </div>
    </div>
  </header>
);

const ComplaintCard = ({ complaint, onUpvote, isAuthenticated, onDelete }) => {
  const [isUpvoting, setIsUpvoting] = useState(false);
  const [localUpvotes, setLocalUpvotes] = useState(
    complaint.upvote_count || complaint.upvotes || 0
  );
  const [userHasUpvoted, setUserHasUpvoted] = useState(
    complaint.user_has_upvoted || false
  );

  const handleDeleteComplaint = async () => {
    if (!isAuthenticated) {
      alert('Please login to delete complaints.');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this complaint?')) {
      return;
    }

    try {
      await onDelete(complaint.id);
    } catch (error) {
      console.error('Error deleting complaint:', error);
      if (error.response?.status === 403) {
        alert('You can only delete your own complaints.');
      } else {
        alert('Failed to delete complaint. Please try again.');
      }
    }
  };
  const det = localStorage.getItem('user_type');
  const handleUpvote = async () => {
    if (!isAuthenticated) {
      alert('Please login to upvote complaints.');
      return;
    }

    if (isUpvoting) return;

    const previousUpvotes = localUpvotes;
    const previousUpvotedStatus = userHasUpvoted;

    const newUpvotedStatus = !userHasUpvoted;
    const newUpvotes = newUpvotedStatus
      ? previousUpvotes + 1
      : previousUpvotes - 1;

    setUserHasUpvoted(newUpvotedStatus);
    setLocalUpvotes(newUpvotes);
    setIsUpvoting(true);

    try {
      await onUpvote(complaint.id, newUpvotedStatus, newUpvotes);
    } catch (error) {
      setUserHasUpvoted(previousUpvotedStatus);
      setLocalUpvotes(previousUpvotes);
      console.error('Failed to update upvote:', error);
    } finally {
      setIsUpvoting(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown date';
    try {
      const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
      return new Date(dateString).toLocaleDateString('en-GB', options);
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatUpvotes = (upvotes) => {
    const count = upvotes || 0;
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`.replace('.0', '');
    }
    return count.toString();
  };

  return (
    <div className="bg-white p-4 rounded-xl border-indigo-100 shadow-md hover:shadow-xl transition-all duration-300 hover:border-indigo-300">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-1 text-indigo-600">
            <UserIcon />
          </div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-lg text-gray-800">
              {complaint.author ||
                complaint.posted_by?.username ||
                'Anonymous User'}
            </p>
            <p className="pl-5 text-sm text-gray-500">
              {formatDate(complaint.posted_at || complaint.date)}
            </p>
          </div>
        </div>
        {isAuthenticated && (
          <button
            onClick={handleDeleteComplaint}
            className="text-red-600 hover:text-red-800 text-sm font-semibold transition-colors"
          >
            Delete
          </button>
        )}
      </div>

      <p className="text-lg text-gray-800 mb-1">{complaint.content}</p>
      <p className="text-gray-600 text-base leading-relaxed mb-4">
        Address: {complaint.address}
      </p>

      <div className="text-sm text-gray-600 mb-4 bg-indigo-50 px-3 py-2 rounded-lg inline-block">
        <span className="font-semibold text-indigo-700">Assigned to:</span>{' '}
        <span className="text-gray-800">
          {complaint.assigned_to ||
            complaint.assignedTo ||
            complaint.category ||
            'Not assigned'}
        </span>
      </div>

      <div className="flex items-center gap-4 pt-4 border-t-2 border-indigo-100">
        <button
          onClick={handleUpvote}
          disabled={isUpvoting}
          className={`flex items-center gap-2 transition-all ${
            isUpvoting
              ? 'text-gray-400 cursor-not-allowed'
              : userHasUpvoted
                ? 'text-indigo-600 hover:text-indigo-700'
                : 'text-gray-600 hover:text-indigo-600'
          } hover:scale-105 transform font-semibold`}
        >
          <ArrowUpIcon
            className={`w-5 h-5 ${isUpvoting ? 'animate-pulse' : ''} ${userHasUpvoted ? 'text-indigo-600' : ''}`}
          />
          <span>{formatUpvotes(localUpvotes)}</span>
        </button>
        <button className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-all hover:scale-105 transform font-semibold">
          <ChatBubbleIcon />
          <span>Comment</span>
        </button>
        <button className="flex items-center gap-2 text-gray-600 hover:text-indigo-600 transition-all hover:scale-105 transform font-semibold">
          <ShareIcon />
          <span>Share</span>
        </button>
      </div>
    </div>
  );
};

const Homepage = () => {
  const navigate = useNavigate();
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState('');
  const [isRaiseOpen, setIsRaiseOpen] = useState(false);

  useEffect(() => {
    const checkAuthStatus = () => {
      const token = localStorage.getItem('access_token');
      const authStatus = localStorage.getItem('isAuthenticated');
      const storedUsername = localStorage.getItem('username');

      if (token && authStatus === 'true' && storedUsername) {
        setIsAuthenticated(true);
        setUsername(storedUsername);
      } else {
        setIsAuthenticated(false);
        setUsername('');
      }
    };

    checkAuthStatus();
    window.addEventListener('storage', checkAuthStatus);

    return () => {
      window.removeEventListener('storage', checkAuthStatus);
    };
  }, []);

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await api.get('/complaints/');
      setComplaints(response.data);
    } catch (err) {
      console.error('Error fetching complaints:', err);
      setError('Failed to load complaints. Please try again later.');
    } finally {
      setLoading(false);
    }
  }, []);

  const handleUpvote = async (
    complaintId,
    expectedUpvotedStatus,
    expectedUpvotes
  ) => {
    try {
      const response = await api.post(`/complaints/${complaintId}/upvote/`);

      setComplaints((prevComplaints) =>
        prevComplaints.map((complaint) =>
          complaint.id === complaintId
            ? {
                ...complaint,
                upvote_count:
                  response.data.upvote_count ||
                  response.data.upvotes ||
                  expectedUpvotes,
                user_has_upvoted:
                  response.data.user_has_upvoted !== undefined
                    ? response.data.user_has_upvoted
                    : expectedUpvotedStatus,
              }
            : complaint
        )
      );

      return response.data;
    } catch (err) {
      console.error('Error upvoting complaint:', err);
      throw err;
    }
  };

  const handleDeleteComplaint = async (complaintId) => {
    try {
      await api.delete(`/complaints/${complaintId}/delete/`);
      alert('Complaint deleted successfully!');
      fetchComplaints();
    } catch (error) {
      console.error('Error deleting complaint:', error);
      throw error;
    }
  };

  const onLoginClick = useCallback(() => {
    navigate('/auth');
  }, [navigate]);

  const onLogoutClick = useCallback(async () => {
    try {
      await api.post('/users/logout');
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('username');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user_type');

      delete api.defaults.headers.common['Authorization'];
      setIsAuthenticated(false);
      setUsername('');
      alert('Logged out successfully!');
    }
  }, []);

  const openRaiseComplaint = useCallback(() => {
    if (!isAuthenticated) {
      alert('Please login to raise a complaint.');
      navigate('/auth');
      return;
    }
    setIsRaiseOpen(true);
  }, [isAuthenticated, navigate]);

  const closeRaiseComplaint = useCallback(() => {
    setIsRaiseOpen(false);
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [fetchComplaints]);

  return (
    <div className="bg-gradient-to-br from-indigo-50 via-blue-50 to-purple-50 font-inter min-h-screen flex flex-col">
      <Header />

      <div className="flex-1 flex">
        <div className="flex-1 flex justify-center px-1 py-1 ">
          <div className="w-full max-w-2xl lg:max-w-4xl space-y-1">
            {loading && (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-indigo-600"></div>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 text-center mb-6">
                <p className="text-red-700 font-semibold">{error}</p>
                <button
                  onClick={fetchComplaints}
                  className="mt-4 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold py-2 px-6 rounded-lg transition-all shadow-lg"
                >
                  Try Again
                </button>
              </div>
            )}

            {!loading && !error && (
              <>
                {complaints.length > 0 ? (
                  complaints.map((complaint) => (
                    <ComplaintCard
                      key={complaint.id}
                      complaint={complaint}
                      onUpvote={handleUpvote}
                      onDelete={handleDeleteComplaint}
                      isAuthenticated={isAuthenticated}
                    />
                  ))
                ) : (
                  <div className="text-center py-12 bg-white rounded-xl border-2 border-indigo-200 shadow-lg">
                    <p className="text-gray-700 text-lg font-semibold">
                      No complaints found.
                    </p>
                    <p className="text-gray-500 mt-2">
                      Be the first to raise a complaint!
                    </p>
                    <button
                      onClick={openRaiseComplaint}
                      className="mt-4 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-all shadow-lg"
                    >
                      Raise First Complaint
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {isRaiseOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border-2 border-indigo-200">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Raise a Complaint
            </h2>
            <p className="text-gray-600 mb-6">
              Complaint form would go here. This is a placeholder modal.
            </p>
            <div className="flex gap-4">
              <button
                onClick={closeRaiseComplaint}
                className="flex-1 bg-gray-500 hover:bg-gray-600 text-white font-semibold py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  closeRaiseComplaint();
                  alert('Complaint raised successfully!');
                }}
                className="flex-1 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white font-semibold py-3 rounded-lg transition-all shadow-lg"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Homepage;
