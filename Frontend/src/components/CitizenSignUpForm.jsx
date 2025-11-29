import React, { useState } from 'react';
import axios from 'axios';
import api from '../utils/axiosConfig';
import { setAccessToken } from '../utils/auth';
import { Eye, EyeOff } from 'lucide-react';



const CitizenSignUpForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showReenterPassword, setShowReenterPassword] = useState(false);
  const [step, setStep] = useState('signup'); 
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    username: '',
    email: '',
    password: '',
    reenterPassword: '',
    phone_number: '',
  });
  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Validate first_name and last_name - only alphabets and spaces
    if (name === 'first_name' || name === 'last_name') {
      const alphabetPattern = /^[A-Za-z\s]*$/;
      if (!alphabetPattern.test(value)) {
        return; // Don't update if invalid characters
      }
    }
    
    setFormData({ ...formData, [name]: value });
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    if (formData.password != formData.reenterPassword) {
      setError("Passwords do not match");
      return;
    }
    
    if (formData.password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await api.post("/users/signup/citizens/", {
        first_name: formData.first_name,
        last_name: formData.last_name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone_number,
      });
      
      setMessage(res.data.message || "OTP sent to your email!");
      setStep('verify'); 
      
    } catch (err) {
      console.log(err.response?.data);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        (typeof err.response?.data === 'object' ? JSON.stringify(err.response.data) : "Failed to send OTP")
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
      setError("Please enter the OTP");
      return;
    }
    
    setLoading(true);
    
    try {
      const res = await api.post("/users/verify-otp/", {
        email: formData.email,
        otp: otp
      });
      
      setMessage(res.data.message || "Registration successful!");
      setStep('success');
      
      // Storing JWT access token in memory 
      if (res.data.access) {
        setAccessToken(res.data.access);
      }
      
      // Store user info in localStorage for UI components
      if (res.data.user_id) {
        localStorage.setItem('user_id', res.data.user_id);
        localStorage.setItem('username', res.data.username);
        localStorage.setItem('isAuthenticated', 'true');
        
        // Redirect after a delay
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
      
    } catch (err) {
      console.log(err.response?.data);
      setError(
        err.response?.data?.error || 
        err.response?.data?.message || 
        "OTP verification failed"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setMessage('');
    setError('');
    setLoading(true);
    
    try {
      const res = await api.post("/users/signup/citizens/", {
        first_name: formData.first_name,
        last_name: formData.last_name,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        phone_number: formData.phone_number,
      });
      
      setMessage("New OTP sent to your email!");
    } catch (err) {
      setError("Failed to resend OTP. Please try again.");
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

  // Success Screen
  if (step === 'success') {
    return (
      <div className="auth-wrapper">
        <div className="flex flex-col items-center justify-center p-4 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl">✅</span>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Registration Successful!</h3>
          <p className="text-gray-600 mb-4">{message}</p>
          <p className="text-black-600">Redirecting to home page...</p>
        </div>
      </div>
    );
  }

  // OTP Verification Form
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
            
            {message && (
              <div className="success-message">
                {message}
              </div>
            )}
            {error && (
              <div className="error-message">
                {error}
              </div>
            )}
            
            <button 
              type="submit" 
              className="login-btn w-full bg-[#4B687A] text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-[#4B687A] focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
              disabled={loading || otp.length !== 6}
            >
              {loading ? 'Verifying...' : 'Verify OTP'}
            </button>
            
            <div className="mt-4 flex justify-between">
              <button 
                type="button" 
                className="text-blue-600 hover:text-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={handleResendOtp}
                disabled={loading}
              >
                {loading ? 'Sending...' : 'Resend OTP'}
              </button>
              
              <button 
                type="button" 
                className="text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                onClick={handleBackToSignup}
                disabled={loading}
              >
                Back to Signup
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-wrapper">
      <form onSubmit={handleSendOtp} className="auth-form">
        <div className="mb-4 relative">
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
          />
        </div>
        
        <div className="mb-4 relative">
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4B687A] focus:border-[#4B687A] outline-none transition-all"
          />
        </div>
        
        <div className="mb-4 relative">
          <input
            type="text"
            name="username"
            placeholder="Enter your Username"
            value={formData.username}
            onChange={handleChange}
            required
            disabled={loading}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#4B687A] focus:border-[#4B687A] outline-none transition-all"
          />
        </div>
        
        <div className="mb-4">
          <input
            type="email"
            name="email"
            placeholder="Enter your Email"
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
            minLength={6}
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
            minLength={6}
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
        
        <div className="mb-6">
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

        {message && (
          <div className="success-message">
            {message}
          </div>
        )}
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <button 
          type="submit" 
          className="login-btn w-full bg-[#4B687A] text-white py-3 px-4 rounded-lg hover:bg-gray-700 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          disabled={loading}
        >
          {loading ? 'Sending OTP...' : 'Send OTP to Email'}
        </button>
      </form>
    </div>
  );
};

export default CitizenSignUpForm; 