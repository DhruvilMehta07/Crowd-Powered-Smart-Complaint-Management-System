import { useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';
import { clearAccessToken } from '../utils/auth';
import React, { useCallback, useState, useEffect } from 'react';

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
      clearAccessToken();
      localStorage.removeItem('user_id');
      localStorage.removeItem('username');
      localStorage.removeItem('isAuthenticated');
      localStorage.removeItem('user_type');
      if (api?.defaults?.headers?.common) {
        delete api.defaults.headers.common['Authorization'];
      }
      navigate('/', { replace: true });
      window.location.reload();
    }
  }, [navigate]);

  const handleLogin = onLoginClick || fallbackOnLogin;
  const handleLogout = onLogoutClick || fallbackOnLogout;

  const [trending, setTrending] = useState([]);
  const [trendingLoading, setTrendingLoading] = useState(true);
  const [trendingError, setTrendingError] = useState(null);

  useEffect(() => {
    let mounted = true;
    const controller = new AbortController();

    const fetchTrending = async () => {
      setTrendingLoading(true);
      setTrendingError(null);

      try {
        const response = await api.get('/complaints/trending/?limit=3', {
          signal: controller.signal,
        });
        if (!mounted) {
          return;
        }
        const complaints = Array.isArray(response.data) ? response.data : [];
        const formatted = complaints.map((complaint) => ({
          id: complaint.id,
          text:
            complaint.content ||
            complaint.description ||
            complaint.title ||
            'Complaint details unavailable.',
          upvotes: `${
            complaint.upvotes_count ??
            complaint.computed_upvotes_count ??
            complaint.upvotes?.length ??
            0
          } Upvotes`,
        }));
        setTrending(formatted);
      } catch (err) {
        if (mounted && err.name !== 'CanceledError' && err.name !== 'AbortError') {
          console.error('Error fetching trending complaints:', err);
          setTrendingError('Failed to load trending complaints');
        }
      } finally {
        if (mounted) {
          setTrendingLoading(false);
        }
      }
    };

    fetchTrending();

    return () => {
      mounted = false;
      controller.abort();
    };
  }, []);

  
  function FieldworkersModal({ open, onClose, workers: initialWorkers = null }) {
    const [localWorkers, setLocalWorkers] = useState(initialWorkers || []);
    const [loading, setLoading] = useState(initialWorkers ? false : false);
    const [error, setError] = useState(null);

    useEffect(() => {
      if (!open) return;
      let mounted = true;
      const controller = new AbortController();

      if (initialWorkers) {
        setLocalWorkers(initialWorkers);
        setLoading(false);
        return () => {
          mounted = false;
          controller.abort();
        };
      }

      const fetchAll = async () => {
        setLoading(true);
        setError(null);
        try {
          const res = await api.get('/complaints/available-workers/', {
            signal: controller.signal,
          });
          if (!mounted) return;
          const data = (res.data || []).map((fw) => ({
            id: fw.id,
            username: fw.username || fw.name || `user-${fw.id}`,
            email: fw.email || '',
            solved_count:
              fw.total_assigned_complaints != null
                ? fw.total_assigned_complaints
                : fw.solved_count || 0,
          }));
          setLocalWorkers(data);
        } catch (err) {
          if (err.name === 'CanceledError' || err.name === 'AbortError') return;
          console.error('Error fetching available workers', err);
          setError(
            err.response?.data?.error ||
              'Failed to load fieldworkers for this department.'
          );
        } finally {
          if (mounted) setLoading(false);
        }
      };

      fetchAll();
      return () => {
        mounted = false;
        controller.abort();
      };
    }, [open, initialWorkers]);

    useEffect(() => {
      if (!open) return;
      const onKeyDown = (e) => {
        if (e.key === 'Escape') onClose?.();
      };
      window.addEventListener('keydown', onKeyDown);
      return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    if (!open) return null;

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center"
        aria-modal="true"
        role="dialog"
      >
        <div
          className="absolute inset-0 bg-black/50"
          onClick={onClose}
          aria-hidden="true"
        />
        <div className="relative bg-white w-full max-w-2xl mx-4 rounded-xl shadow-xl border border-gray-200">
          <div className="flex items-center justify-between px-5 py-4 border-b">
            <h2 className="text-lg font-semibold text-[#4B687A]">
              Fieldworkers in Your Department
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 rounded p-1"
              aria-label="Close"
            >
              ✕
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-5">
            {loading ? (
              <div className="text-center text-gray-600">Loading...</div>
            ) : error ? (
              <div className="text-center text-red-600">{error}</div>
            ) : localWorkers.length === 0 ? (
              <div className="text-center text-gray-600">
                No fieldworkers found for this department.
              </div>
            ) : (
              <div className="divide-y">
                {localWorkers.map((w) => (
                  <div
                    key={w.id}
                    className="py-3 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <div className="rounded-full bg-gray-100 w-10 h-10 flex items-center justify-center text-sm font-semibold text-[#4B687A]">
                        {w.username ? w.username.charAt(0).toUpperCase() : '#'}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-gray-800">
                          {w.username}
                        </div>
                        <div className="text-xs text-gray-500">{w.email}</div>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-[#4B687A]">
                      {w.solved_count}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-5 py-4 border-t flex justify-end">
            <button
              onClick={onClose}
              className="bg-[#4B687A] text-white font-semibold px-4 py-2 rounded-lg hover:bg-[#3C5260] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  const GovAuthRightbar = () => {
    return (
      <div className="sticky top-5 flex flex-col h-[calc(100vh-6rem)] mx-auto">
        <div className="flex items-center mx-auto mb-6">
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
              className="bg-[#4B687A] text-white font-bold py-3 px-8 rounded-xl hover:bg-[#3C5260] transition-colors duration-300 shadow-lg"
            >
              Login / SignUp
            </button>
          )}
        </div>

        <FieldWorkerLeaderboard />
      </div>
    );
  };

  // Field Worker Leaderboard
  function FieldWorkerLeaderboard() {
    const [workers, setWorkers] = useState([]);
    const [loadingWorkers, setLoadingWorkers] = useState(true);
    const [errorWorkers, setErrorWorkers] = useState(null);
    const userType = typeof window !== 'undefined' ? localStorage.getItem('user_type') : null;
    // removed modalOpen state — leaderboard is no longer clickable to open a modal

    useEffect(() => {
      let mounted = true;

      const fetchWorkers = async () => {
        setLoadingWorkers(true);
        setErrorWorkers(null);

        let departmentId = null;

        if (userType === 'authority' || userType === 'fieldworker') {
          try {
            const profileRes = await api.get('/users/profile/');
            departmentId = profileRes.data?.assigned_department?.id ?? null;
          } catch (profileErr) {
            console.error('Error fetching profile for leaderboard', profileErr);
            departmentId = null;
          }
        }

        const queryConfig = departmentId ? { params: { department: departmentId } } : {};

        try {
          const res = await api.get('/complaints/top-fieldworkers/', queryConfig);
          if (!mounted) {
            return;
          }

          const list = (res.data || []).map((fw) => ({
            id: fw.id,
            username: fw.username || fw.name || `user-${fw.id}`,
            email: fw.email || '',
            solved_count:
              fw.total_assigned_complaints ?? fw.total_assigned ?? fw.solved_count ?? 0,
          }));

          setWorkers(list);
        } catch (err) {
          if (!mounted) {
            return;
          }
          console.error('Error fetching fieldworker leaderboard', err);
          setErrorWorkers(err.response?.data?.error || 'Failed to load leaderboard');
        } finally {
          if (mounted) {
            setLoadingWorkers(false);
          }
        }
      };

      fetchWorkers();

      return () => {
        mounted = false;
      };
    }, [userType]);

    const visible = workers.slice(0, 3);

    return (
      <>
        <div className="bg-white p-4 rounded-xl border-3 border-gray-300 mb-4 hover:shadow-md transition-all">
          <h3 className="text-center font-bold text-lg text-[#4B687A] mb-3">
            Field Worker Leaderboard
          </h3>

          {loadingWorkers ? (
            <div className="text-sm text-gray-600">Loading leaderboard...</div>
          ) : errorWorkers ? (
            <div className="text-sm text-red-600">{errorWorkers}</div>
          ) : workers.length === 0 ? (
            <div className="text-sm text-gray-600">No field workers yet.</div>
          ) : (
            <div>
              {visible.map((w, idx) => (
                <div
                  key={w.id || idx}
                  className="py-2 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3">
                    <div className="rounded-full bg-gray-100 w-10 h-10 flex items-center justify-center text-sm font-semibold text-[#4B687A]">
                      {w.username ? w.username.charAt(0).toUpperCase() : '#'}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-gray-800">
                        {w.username || w.name || 'Unknown'}
                      </div>
                      <div className="text-xs text-gray-500">{w.email || ''}</div>
                    </div>
                  </div>
                  <div className="text-sm font-bold text-[#4B687A]">
                    {w.solved_count != null ? w.solved_count : 0}
                  </div>
                </div>
              ))}
              {workers.length > 3 && (
                <div className="pt-2 text-center text-xs text-gray-500">
                  View more in the Fieldworkers section
                </div>
              )}
            </div>
          )}
        </div>
        {/* Modal removed from click behavior — kept component defined above in case it's used elsewhere */}
      </>
    );
  }

  const CitizenRightbar = () => {
    return (
      <div className="sticky top-5 flex flex-col h-[calc(100vh-6rem)] mx-auto">
        <div className="flex items-center mx-auto mb-6">
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
              className="bg-[#4B687A] text-white font-bold py-3 px-8 rounded-xl hover:bg-[#3C5260] transition-colors duration-300 shadow-lg"
            >
              Login / SignUp
            </button>
          )}
        </div>

        <div className="bg-white p-5 rounded-xl mt-15 border-3 border-gray-300">
          <h3 className="font-bold text-xl text-center mb-4 text-[#4B687A]">
            Trending Complaints
          </h3>
          <div className="space-y-4">
            {trendingLoading ? (
              <div className="text-center text-gray-600">Loading...</div>
            ) : trendingError ? (
              <div className="text-center text-red-600">{trendingError}</div>
            ) : trending.length === 0 ? (
              <div className="text-center text-gray-600">No complaints yet</div>
            ) : (
              trending.map((item) => (
                <div
                  key={item.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/complaint/${item.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate(`/complaint/${item.id}`);
                    }
                  }}
                  className="text-sm hover:bg-[#4B687A]/10 p-3 rounded-lg transition-all cursor-pointer"
                >
                  <p className="text-gray-700 clamped-text">{item.text}</p>
                  <p className="font-bold text-[#4B687A] mt-1">{item.upvotes}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    );
  };

  const FieldWorkerRightbar = () => {
    return (
      <div className="sticky top-5 flex flex-col h-[calc(100vh-6rem)] mx-auto">
        <div className="flex items-center mx-auto mb-6">
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
              className="bg-[#4B687A] text-white font-bold py-3 px-8 rounded-xl hover:bg-[#3C5260] transition-colors duration-300 shadow-lg"
            >
              Login / SignUp
            </button>
          )}
        </div>

        <FieldWorkerLeaderboard />
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
        return <FieldWorkerRightbar />;

      default:
        return <CitizenRightbar />;
    }
  };

  return (
    <aside className="w-80 p-4 bg-white hidden md:block border-l-3 border-gray-400 h-screen sticky top-0 overflow-auto">
      {Routing()}
    </aside>
  );
}
