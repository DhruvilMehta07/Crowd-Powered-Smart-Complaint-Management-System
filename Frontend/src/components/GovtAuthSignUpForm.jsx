import React, { useState, useEffect } from 'react';
import axios from 'axios';
import api from '../utils/axiosConfig';
import { setAccessToken } from '../utils/auth';
import { Eye, EyeOff } from 'lucide-react';

axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

const GovtAuthSignUpForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showReenterPassword, setShowReenterPassword] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [isOtherSelected, setIsOtherSelected] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    reenterPassword: '',
    phone_number: '',
    assigned_department: '',
    new_department: '',
  });

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP flow state
  const [step, setStep] = useState('signup'); // 'signup' | 'verify' | 'success'
  const [otp, setOtp] = useState('');

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const res = await api.get('/users/departments/');
        setDepartments(res.data);
      } catch (err) {
        console.error('Error fetching departments:', err);
      }
    };
    fetchDepartments();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Validate first_name and last_name - only alphabets and spaces
    if (name === 'first_name' || name === 'last_name') {
      const alphabetPattern = /^[A-Za-z\s]*$/;
      if (!alphabetPattern.test(value)) {
        return; // Don't update if invalid characters
      }
    }

    if (name === 'assigned_department') {
      if (value === 'other') {
        setIsOtherSelected(true);
        setFormData({ ...formData, assigned_department: '', new_department: '' });
      } else {
        setIsOtherSelected(false);
        setFormData({ ...formData, assigned_department: value, new_department: '' });
      }
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    if (formData.password != formData.reenterPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }

    try {
      let departmentToSend;

      if (isOtherSelected) {
        const deptRes = await api.post('/users/departments/', {
          name: formData.new_department,
        });
        departmentToSend = deptRes.data.id;
      } else {
        departmentToSend = formData.assigned_department;
      }

      // Post to the same endpoint — backend should send OTP for verification
      const res = await api.post('/users/signup/authorities/', {
        first_name: formData.first_name,
        last_name: formData.last_name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone_number,
        assigned_department_id: departmentToSend,
      });

      setMessage(res.data.message || 'OTP sent to your email!');
      setStep('verify');
      setIsOtherSelected(false);
    } catch (err) {
      setError(
        err.response?.data?.error ||
          (typeof err.response?.data === 'object' ? JSON.stringify(err.response.data) : 'Signup failed')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!otp) {
      setError('Please enter the OTP');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/users/verify-otp/', {
        email: formData.email,
        otp: otp,
      });

      setMessage(res.data.message || 'Registration successful!');
      setStep('success');

      if (res.data.access) {
        setAccessToken(res.data.access);
      }

      if (res.data.user_id) {
        localStorage.setItem('user_id', res.data.user_id);
        localStorage.setItem('username', res.data.username);
        localStorage.setItem('isAuthenticated', 'true');
        if (res.data.user_type) {
          localStorage.setItem('user_type', res.data.user_type);
        }

        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    } catch (err) {
      console.log(err.response?.data);
      setError(err.response?.data?.error || err.response?.data?.message || 'OTP verification failed');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setMessage('');
    setError('');
    setLoading(true);

    try {
      // Re-send the signup request to trigger a new OTP
      await api.post('/users/signup/authorities/', {
        first_name: formData.first_name,
        last_name: formData.last_name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone_number,
      });

      setMessage('New OTP sent to your email!');
    } catch (err) {
      console.error('Resend OTP failed', err);
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToSignup = () => {
    setStep('signup');
    setOtp('');
    setMessage('');
    setError('');
  };

  // Success screen (no nested forms)
  if (step === 'success') {
    return (
      <div className="auth-wrapper">
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Registration Successful!</h3>
          <p className="text-gray-600 mb-4">{message}</p>
          <p className="text-blue-600">Redirecting to home page...</p>
        </div>
      </div>
    );
  }

  // OTP verification form (separate top-level return to avoid nested <form>)
  if (step === 'verify') {
    return (
      <div className="auth-wrapper">
        <div className="p-4">
          <h3 className="text-xl font-semibold text-gray-800 mb-2 text-center">Verify Your Email</h3>
          <p className="text-gray-600 mb-6 text-center">
            We sent a verification code to <strong>{formData.email}</strong>
          </p>

          <form onSubmit={handleVerifyOtp} className="auth-form">
            <div className="mb-4">
              <input
                type="text"
                placeholder="Enter 6-digit OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                maxLength={6}
                required
                disabled={loading}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4B687A] focus:border-[#4B687A] outline-none transition-all"
              />
            </div>

            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              className="login-btn w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>

            <div className="mt-4 flex justify-between">
              <button type="button" onClick={handleResendOtp} className="text-blue-600 hover:text-blue-800">
                {loading ? 'Sending...' : 'Resend OTP'}
              </button>
              <button type="button" onClick={handleBackToSignup} className="text-gray-600 hover:text-gray-800">
                Back to Signup
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Default: Signup form (step === 'signup')
  return (
    <div className="auth-wrapper">
      <form onSubmit={handleSubmit} className="auth-form">
        <div className="mb-4">
          <input
            type="text"
            name="first_name"
            placeholder="Enter your First Name (alphabets only)"
            value={formData.first_name}
            onChange={handleChange}
            pattern="[A-Za-z\s]+"
            title="First name must contain only alphabets and spaces"
            required
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4B687A] focus:border-[#4B687A] outline-none transition-all disabled:opacity-50"
          />
        </div>
        
        <div className="mb-4">
          <input
            type="text"
            name="last_name"
            placeholder="Enter your Last Name (alphabets only)"
            value={formData.last_name}
            onChange={handleChange}
            pattern="[A-Za-z\s]+"
            title="Last name must contain only alphabets and spaces"
            required
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4B687A] focus:border-[#4B687A] outline-none transition-all disabled:opacity-50"
          />
        </div>
        
        <div className="mb-4">
          <input
            type="text"
            name="username"
            placeholder="Enter your Username"
            value={formData.username}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4B687A] focus:border-[#4B687A] outline-none transition-all disabled:opacity-50"
          />
        </div>

        <div className="mb-4">
          <input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={formData.email}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4B687A] focus:border-[#4B687A] outline-none transition-all disabled:opacity-50"
          />
        </div>

        <div className="mb-4 relative">
          <input
            type={showPassword ? 'text' : 'password'}
            name="password"
            placeholder="Enter Password"
            value={formData.password}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4B687A] focus:border-[#4B687A] outline-none transition-all disabled:opacity-50 pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loading}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#4B687A] disabled:opacity-50 bg-transparent border-none cursor-pointer transition-colors"
          >
            {showPassword ? <EyeOff size={18} className="sm:w-5 sm:h-5" /> : <Eye size={18} className="sm:w-5 sm:h-5" />}
          </button>
        </div>

        <div className="mb-4 relative">
          <input
            type={showReenterPassword ? 'text' : 'password'}
            name="reenterPassword"
            placeholder="Re-enter Password"
            value={formData.reenterPassword}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4B687A] focus:border-[#4B687A] outline-none transition-all disabled:opacity-50 pr-12"
          />
          <button
            type="button"
            onClick={() => setShowReenterPassword(!showReenterPassword)}
            disabled={loading}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-[#4B687A] disabled:opacity-50 bg-transparent border-none cursor-pointer transition-colors"
          >
            {showReenterPassword ? <EyeOff size={18} className="sm:w-5 sm:h-5" /> : <Eye size={18} className="sm:w-5 sm:h-5" />}
          </button>
        </div>

        <div className="mb-4">
          <input
            type="tel"
            name="phone_number"
            placeholder="Enter Mobile Number"
            value={formData.phone_number}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4B687A] focus:border-[#4B687A] outline-none transition-all disabled:opacity-50"
          />
        </div>

        <div className="mb-4">
          <select
            name="assigned_department"
            value={formData.assigned_department || (isOtherSelected ? 'other' : '')}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4B687A] focus:border-[#4B687A] outline-none transition-all disabled:opacity-50"
          >
            <option value="" disabled>
              Select Department
            </option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
            <option value="other">Other</option>
          </select>
        </div>

        {isOtherSelected && (
          <div className="mb-6">
            <input
              type="text"
              name="new_department"
              placeholder="Enter new department"
              value={formData.new_department}
              onChange={handleChange}
              required
              disabled={loading}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4B687A] focus:border-[#4B687A] outline-none transition-all disabled:opacity-50"
            />
          </div>
        )}

        {message && (
          <div className="success-message mb-4 p-3 bg-green-100 text-green-700 rounded-lg">{message}</div>
        )}
        {error && <div className="error-message mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>}

        <button
          type="submit"
          className="login-btn w-full bg-[#4B687A] text-white py-3 px-4 rounded-lg hover:bg-gray-700 focus:ring-2 focus:ring-[#4B687A] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          disabled={loading}
        >
          {loading ? 'Signing Up...' : 'SignUp'}
        </button>
      </form>
    </div>
  );
};

export default GovtAuthSignUpForm;