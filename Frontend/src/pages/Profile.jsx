import React, { useEffect, useState } from 'react';
import api from '../utils/axiosConfig';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Change password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMessage, setPwMessage] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await api.get('/users/profile/');
        setProfile(res.data);
      } catch (err) {
        console.error('Failed to load profile', err);
        setError('Unable to load profile.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPwMessage('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPwMessage('Please fill all password fields.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwMessage('New password and confirm password do not match.');
      return;
    }

    setPwLoading(true);
    try {
      // Attempt to call backend change/reset endpoint. Adjust path if your backend requires different fields.
      const payload = {
        current_password: currentPassword,
        new_password: newPassword,
      };

      const res = await api.post('/users/reset-password/', payload);

      if (res.status === 200 || res.status === 204) {
        setPwMessage('Password changed successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        setPwMessage('Password change response: ' + (res.data?.message || res.statusText));
      }
    } catch (err) {
      console.error('Password change error', err);
      const msg = err.response?.data?.detail || err.response?.data || err.message;
      setPwMessage(typeof msg === 'string' ? msg : JSON.stringify(msg));
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center">Loading profile...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow p-6 mb-6">
        <h2 className="text-2xl font-semibold text-[#4B687A] mb-4">Profile</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-gray-500">Name</div>
            <div className="font-medium text-lg">{profile?.first_name} {profile?.last_name}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Username</div>
            <div className="font-medium text-lg">{profile?.username}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Email</div>
            <div className="font-medium text-lg">{profile?.email}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Phone</div>
            <div className="font-medium text-lg">{profile?.phone_number || '—'}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Joined</div>
            <div className="font-medium text-lg">{profile?.date_joined ? new Date(profile.date_joined).toLocaleString() : '—'}</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow p-6">
        <h3 className="text-xl font-semibold text-[#4B687A] mb-4">Change password</h3>
        <form onSubmit={handleChangePassword} className="space-y-3">
          <input
            type="password"
            placeholder="Current password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2"
          />
          <input
            type="password"
            placeholder="New password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2"
          />
          <input
            type="password"
            placeholder="Confirm new password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-2"
          />

          {pwMessage && <div className="text-sm text-gray-700">{pwMessage}</div>}

          <button
            type="submit"
            disabled={pwLoading}
            className="bg-[#4B687A] text-white py-2 px-4 rounded-lg hover:bg-[#3C5260] disabled:opacity-60"
          >
            {pwLoading ? 'Changing…' : 'Change password'}
          </button>
        </form>
      </div>
    </div>
  );
}
