import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import googleLogo from '../assets/google-logo.svg';

import CitizenSignUpForm from './CitizenSignUpForm';
import GovtAuthSignUpForm from './GovtAuthSignUpForm';
import FieldWorkerSignUpForm from './FieldWorkerSignUpForm';
import AdminSignUpForm from './AdminSignUpForm';

// Configure axios defaults
axios.defaults.withCredentials = true;

const LoginForm = ({ 
  loginFormData, 
  handleLoginChange, 
  handleLoginSubmit, 
  showPassword, 
  setShowPassword, 
  loading, 
  message, 
  error,
  testConnection 
}) => (
  <form onSubmit={handleLoginSubmit} className="auth-form">
    {/* Debug connection button */}
    <button 
      type="button" 
      onClick={testConnection}
      className="mb-4 text-sm text-blue-600 hover:text-blue-800 underline"
    >
      Test Backend Connection
    </button>

    <div className="input-group relative mb-4">
      <input
        type="text"
        name="username"
        placeholder="Enter your username"
        value={loginFormData.username}
        onChange={handleLoginChange}
        required
        disabled={loading}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
      />
    </div>
    
    <div className="input-group relative mb-6">
      <input
        type={showPassword ? 'text' : 'password'}
        name="password"
        placeholder="Enter Password"
        value={loginFormData.password}
        onChange={handleLoginChange}
        required
        disabled={loading}
        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50 pr-12"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        disabled={loading}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50 bg-transparent border-none cursor-pointer text-sm"
      >
        {showPassword ? 'Hide' : 'Show'}
      </button>
    </div>
    
    <button 
      type="submit" 
      className="login-btn w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
      disabled={loading}
    >
      {loading ? 'Logging in...' : 'Login'}
    </button>
    
    {message && (
      <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded-lg">
        {message}
      </div>
    )}
    {error && (
      <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-lg">
        {error}
      </div>
    )}
  </form>
);

const Login = ({ activeTab }) => {
  const navigate = useNavigate();
  const [activeForm, setActiveForm] = useState('SignUp');
  const [showPassword, setShowPassword] = useState(false);
  const [loginFormData, setLoginFormData] = useState({
    username: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // No need for CSRF initialization with JWT
  useEffect(() => {
    // You can add any initialization logic here if needed
    console.log('Login component mounted - JWT authentication');
  }, []);

  const handleLoginChange = (e) => {
    setLoginFormData({ 
      ...loginFormData, 
      [e.target.name]: e.target.value 
    });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      console.log('Attempting JWT login...');
      
      const response = await axios.post(
        "http://localhost:7000/users/login/", 
        loginFormData,
        {
          headers: {
            'Content-Type': 'application/json',
          },
          withCredentials: true
        }
      );

      console.log('JWT Login successful:', response.data);

      if (response.data.access) {
        // Store the access token in localStorage
        localStorage.setItem('access_token', response.data.access);
        localStorage.setItem('user_id', response.data.user_id);
        localStorage.setItem('username', response.data.username);
        localStorage.setItem('isAuthenticated', 'true');
        
        // Set default Authorization header for future requests
        axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.access}`;
        
        setMessage('Login successful! Redirecting...');
        
        // Redirect after delay
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }
    } catch (err) {
      console.error('JWT Login error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message,
        code: err.code
      });
      
      if (err.response) {
        if (err.response.status === 401) {
          setError('Invalid username or password');
        } else if (err.response.status === 403) {
          setError('Account pending admin verification');
        } else if (err.response.status === 400) {
          setError(err.response.data.error || 'Invalid form data');
        } else {
          setError(err.response.data.error || `Server error: ${err.response.status}`);
        }
      } else if (err.request) {
        setError('Cannot connect to server. Please check: 1) Backend is running, 2) Port 7000 is correct');
      } else {
        setError('Login failed: ' + err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  // Test backend connection
  const testConnection = async () => {
    setLoading(true);
    setError('');
    setMessage('');
    
    try {
      const response = await axios.get('http://localhost:7000/users/departments/', {
        withCredentials: true,
        timeout: 5000
      });
      setMessage('✅ Backend connection successful! JWT endpoints are working.');
      console.log('Connection test response:', response.data);
    } catch (err) {
      console.error('Connection test failed:', err);
      if (err.response) {
        setError(`Backend responded with ${err.response.status}: ${err.response.data?.detail || 'Check endpoint'}`);
      } else {
        setError('❌ Cannot connect to backend. Check: 1) Server running on port 7000, 2) Backend CORS configured');
      }
    } finally {
      setLoading(false);
    }
  };

  const renderSignUpForm = () => {
    switch (activeTab) {
      case 'Citizen':
        return <CitizenSignUpForm />;
      case 'Government Authority':
        return <GovtAuthSignUpForm />;
      case 'Field Worker':
        return <FieldWorkerSignUpForm />;
      case 'Admin':
        return <AdminSignUpForm />;
      default:
        return <CitizenSignUpForm />;
    }
  };

  return (
    <div className="mt-24 bg-white p-10 rounded-xl shadow-lg w-full max-w-md mx-auto text-center">
      {/* Form Toggle */}
      <div className="flex justify-center gap-10 mb-6">
        <span 
          className={`text-lg cursor-pointer transition-all duration-300 pb-1 ${
            activeForm === 'Login' 
              ? 'border-b-2 border-[#4a6978] text-[#4a6978] font-semibold' 
              : 'text-[#7b8d97] hover:text-[#4a6978]' 
          }`}
          onClick={() => setActiveForm('Login')}
        >
          Login
        </span>
        <span 
          className={`text-lg cursor-pointer transition-all duration-300 pb-1 ${
            activeForm === 'SignUp' 
              ? 'border-b-2 border-[#4a6978] text-[#4a6978] font-semibold' 
              : 'text-[#7b8d97] hover:text-[#4a6978]'
          }`}
          onClick={() => setActiveForm('SignUp')}
        >
          SignUp
        </span>
      </div>

      {activeForm === 'Login' ? (
        <LoginForm 
          loginFormData={loginFormData}
          handleLoginChange={handleLoginChange}
          handleLoginSubmit={handleLoginSubmit}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
          loading={loading}
          message={message}
          error={error}
          testConnection={testConnection}
        />
      ) : (
        renderSignUpForm()
      )}

      <div className="relative flex items-center py-6">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink mx-4 text-[#7b8d97] text-sm font-medium">Or</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>

      <div className="flex justify-center">
        <img
          src={googleLogo}
          alt="Google sign-in"
          className="w-10 h-10 cursor-pointer transition-transform duration-200 hover:scale-110"
        />
      </div>
    </div>
  );
};

export default Login;