// Notifications.jsx - dynamic notifications list
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/axiosConfig';

export default function Notifications() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    let mounted = true;

    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await api.get('/notifications/notifications/');
        if (!mounted) return;
        setNotifications(res.data || []);
        setError('');
      } catch (err) {
        console.error('Failed to fetch notifications', err);
        setError('Failed to load notifications.');
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchNotifications();

    return () => {
      mounted = false;
    };
  }, []);

  const handleNotificationClick = async (notif) => {
    try {
      // mark single notification as read (backend list view already marks all read, but keep for safety)
      if (notif && notif.id) {
        try {
          await api.post(`complaints/notifications/${notif.id}/mark-read/`);
        } catch (err) {
          // ignore
        }
      }

      if (notif && notif.link) {
        // if link is absolute http(s)
        if (/^https?:\/\//.test(notif.link)) {
          window.location.href = notif.link;
        } else {
          navigate(notif.link);
        }
      }
    } catch (err) {
      console.error('Error handling notification click', err);
    }
  };

  return (
    <div className="p-1 bg-grey min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg border-2 border-indigo-100 p-6">
          <h1 className="text-3xl font-bold text-indigo-900 mb-4">Notifications</h1>

          {loading ? (
            <div className="p-6 text-center">Loading...</div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">{error}</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-4xl">🔔</span>
              </div>
              <p className="text-gray-600 text-lg">No notifications yet.</p>
              <p className="text-gray-500 mt-2 text-sm">You'll be notified when there are updates on your complaints.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {notifications.map((n) => (
                <li
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-4 cursor-pointer hover:bg-gray-50 flex justify-between items-start ${n.is_read ? '' : 'bg-white'}`}>
                  <div>
                    <div className="text-sm text-gray-800">{n.message}</div>
                    <div className="text-xs text-gray-500 mt-1">{new Date(n.created_at).toLocaleString()}</div>
                  </div>
                  {!n.is_read && (
                    <div className="ml-4 flex-shrink-0">
                      <span className="inline-block w-2 h-2 bg-red-600 rounded-full" />
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}