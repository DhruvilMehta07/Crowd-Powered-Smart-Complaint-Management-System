import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import googleLogo from '../assets/google-logo.svg';

import CitizenSignUpForm from './CitizenSignUpForm';
import GovtAuthSignUpForm from './GovtAuthSignUpForm';
import FieldWorkerSignUpForm from './FieldWorkerSignUpForm';
import AdminSignUpForm from './AdminSignUpForm';

// Configure axios for CSRF
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
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
    {/* Optional: Test connection button for debugging */}
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

  // Get CSRF token on component mount
  useEffect(() => {
    const getCSRFToken = async () => {
      try {
        // First, make a GET request to get the CSRF token cookie
        await axios.get('http://localhost:7000/users/csrf/', {
          withCredentials: true
        });
        console.log('CSRF token retrieved');
      } catch (err) {
        console.warn('Could not get CSRF token:', err);
      }
    };

    getCSRFToken();
  }, []);

  // Login form handlers
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
      // Get CSRF token from cookie
      const getCookie = (name) => {
        let cookieValue = null;
        if (document.cookie && document.cookie !== '') {
          const cookies = document.cookie.split(';');
          for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
              cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
              break;
            }
          }
        }
        return cookieValue;
      };

      const csrfToken = getCookie('csrftoken');
      
      if (!csrfToken) {
        throw new Error('CSRF token not found');
      }

      const res = await axios.post("http://localhost:7000/users/login/", 
        loginFormData,  
        {
          headers: {
            'Content-Type': 'application/json',
            'X-CSRFToken': csrfToken,
          },
          withCredentials: true
        }
      );

      console.log('Login response:', res.data);

      if (res.data.message) {
        setMessage('Login successful');
        
        // Store user info in localStorage
        localStorage.setItem('user_id', res.data.user_id);
        localStorage.setItem('username', res.data.username);
        localStorage.setItem('isAuthenticated', 'true');
        
        // Optional: Store additional user data if available
        if (res.data.user_type) {
          localStorage.setItem('user_type', res.data.user_type);
        }
        
        // Redirect to home page
        setTimeout(() => {
          navigate('/');
        }, 1000);
      }
    } catch (err) {
      console.error('Login error:', err);
      console.error('Error response:', err.response?.data);
      
      // Better error handling with CSRF specific error
      if (err.response?.status === 403 && err.response?.data?.detail?.includes('CSRF')) {
        setError('Security token missing. Please refresh the page and try again.');
      } else if (err.response?.status === 401) {
        setError('Invalid username or password');
      } else if (err.response?.status === 400) {
        setError(err.response.data.error || 'Invalid form data');
      } else if (err.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else if (err.code === 'NETWORK_ERROR' || err.code === 'ECONNREFUSED') {
        setError('Cannot connect to server. Please check if the backend is running.');
      } else if (err.message === 'CSRF token not found') {
        setError('Security token issue. Please refresh the page.');
      } else {
        setError(err.response?.data?.error || 'Login failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Test backend connection (optional)
  const testConnection = async () => {
    try {
      const res = await axios.get('http://localhost:7000/users/test/', {
        withCredentials: true
      });
      console.log('Connection test:', res.data);
      setMessage('Backend connection successful');
    } catch (err) {
      console.error('Connection test failed:', err);
      setError('Cannot connect to backend server');
    }
  };

  // Signup form renderer
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

      {/* Render the correct form */}
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

      {/* Divider */}
      <div className="relative flex items-center py-6">
        <div className="flex-grow border-t border-gray-300"></div>
        <span className="flex-shrink mx-4 text-[#7b8d97] text-sm font-medium">Or</span>
        <div className="flex-grow border-t border-gray-300"></div>
      </div>

      {/* Google Login */}
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