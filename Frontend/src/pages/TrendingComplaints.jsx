import { useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { clearAccessToken } from '../utils/auth';
import React, { useCallback } from 'react';

const LogoutIcon = ({ className = 'w-5 h-5' }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className}
  >
    <path
      fillRule="evenodd"
      d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm10.72 4.72a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H9a.75.75 0 010-1.5h10.94l-1.72-1.72a.75.75 0 010-1.06z"
      clipRule="evenodd"
    />
  </svg>
);

const UserCircleIcon = ({ className = 'w-6 h-6' }) => (
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

export default function TrendingComplaints({
  showViewMore = true,

  username,
  onLogoutClick,
  onLoginClick,
}) {
  const navigate = useNavigate();
  const isAuthenticated = localStorage.getItem('isAuthenticated');
  const fallbackOnLogin = useCallback(() => {
    navigate('/auth');
  }, [navigate]);

  const fallbackOnLogout = useCallback(async () => {
    try {
      await api.post('/users/logout/');
    } catch (error) {
      console.warn('Logout API call failed:', error);
    } finally {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_id');
      localStorage.removeItem('username');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user_type');
      if (api?.defaults?.headers?.common) {
        delete api.defaults.headers.common['Authorization'];
      }
      navigate('/');
      alert('Logged out successfully!');
    }
  }, [navigate]);

  const handleLogin = onLoginClick || fallbackOnLogin;
  const handleLogout = onLogoutClick || fallbackOnLogout;

  const trendingComplaints = [
    {
      text: 'Struggling with potholes every day on the way to office, making travel unsafe and tiring.',
      upvotes: '4k Upvotes',
    },
    {
      text: 'Stuck in long, stressful traffic jams during peak office hours.',
      upvotes: '3.2k Upvotes',
    },
    {
      text: "Facing a lot of difficulty as water hasn't come for two days.",
      upvotes: '2k Upvotes',
    },
  ];

  const GovAuthRightbar = () => {
    return (
      <div className="sticky top-5 flex flex-col h-[calc(100vh-6rem)] mx-auto">
        <div className="flex items-center mx-auto">
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-red-700 transition-colors duration-300 shadow-lg"
            >
              <LogoutIcon className="w-4 h-4" />
              Logout
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-blue-700 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-800 transition-colors duration-300 shadow-lg"
            >
              Login / SignUp
            </button>
          )}
        </div>
        <div className="bg-white p-5 rounded-xl mt-15 border-3 border-indigo-400">
          <h3 className="font-bold text-xl text-center mb-4 text-indigo-900">
            Work in Progress
          </h3>
          <div className="space-y-4">
            {trendingComplaints.map((item, index) => (
              <div
                key={index}
                className="text-sm hover:bg-indigo-50 p-3 rounded-lg transition-all cursor-pointer"
              >
                <p className="text-gray-700">{item.text}</p>
                <p className="font-bold text-indigo-600 mt-1">{item.upvotes}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const CitizenRightbar = () => {
    return (
      <div className="sticky top-5 flex flex-col h-[calc(100vh-6rem)] mx-auto">
        <div className="flex items-center mx-auto">
          {isAuthenticated ? (
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 bg-red-600 text-white font-bold py-3 px-8 rounded-xl hover:bg-red-700 transition-colors duration-300 shadow-lg"
            >
              <LogoutIcon className="w-4 h-4" />
              Logout
            </button>
          ) : (
            <button
              onClick={handleLogin}
              className="bg-blue-700 text-white font-bold py-3 px-8 rounded-xl hover:bg-blue-800 transition-colors duration-300 shadow-lg"
            >
              Login / SignUp
            </button>
          )}
        </div>
        <div className="bg-white p-5 rounded-xl mt-15 border-3 border-indigo-400">
          <h3 className="font-bold text-xl text-center mb-4 text-indigo-900">
            Trending Complaints
          </h3>
          <div className="space-y-4">
            {trendingComplaints.map((item, index) => (
              <div
                key={index}
                className="text-sm hover:bg-indigo-50 p-3 rounded-lg transition-all cursor-pointer"
              >
                <p className="text-gray-700">{item.text}</p>
                <p className="font-bold text-indigo-600 mt-1">{item.upvotes}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  const Routing = () => {
    const ut = localStorage.getItem('user_type');

    switch (ut) {
      case 'authority':
        return <GovAuthRightbar />;
      case 'citizen':
        return <CitizenRightbar />;
      case 'fieldworker':
        return <WorkerRightbar />;
      default:
        return <CitizenRightbar />;
    }
  };

  return (
    <aside className="w-80 p-4 bg-white hidden md:block border-r-3 border-indigo-400">
      {Routing()}
    </aside>
  );
}
