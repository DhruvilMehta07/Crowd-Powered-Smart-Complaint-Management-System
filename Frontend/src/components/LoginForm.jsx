import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Shield, CheckCircle, AlertCircle } from 'lucide-react';

import CitizenSignUpForm from './CitizenSignUpForm';
import GovtAuthSignUpForm from './GovtAuthSignUpForm';
import FieldWorkerSignUpForm from './FieldWorkerSignUpForm';
import AdminSignUpForm from './AdminSignUpForm';

// Configure axios defaults for JWT (from your first file)
axios.defaults.withCredentials = true;

// -----------------------------------------------------------------
// STYLED LoginForm Component (from your second file)
// I've made one small but important change:
// Wrapped it in a <form> and set the button type="submit"
// to work with your existing handleLoginSubmit function.
// -----------------------------------------------------------------
const LoginForm = ({ 
  loginFormData, 
  handleLoginChange, 
  handleLoginSubmit, // This is the JWT-based handler
  showPassword, 
  setShowPassword, 
  loading, 
  message, 
  error,
  testConnection, // This is the JWT-based handler
  setActiveForm
}) => (
  <form onSubmit={handleLoginSubmit} className="space-y-3 sm:space-y-4 md:space-y-5">
    <div className="relative">
      <input
        type="text"
        name="username"
        placeholder="Username or Email"
        value={loginFormData.username}
        onChange={handleLoginChange}
        required
        disabled={loading}
        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:opacity-50 disabled:bg-gray-100"
      />
    </div>
    
    <div className="relative">
      <input
        type={showPassword ? 'text' : 'password'}
        name="password"
        placeholder="Password"
        value={loginFormData.password}
        onChange={handleLoginChange}
        required
        disabled={loading}
        className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-sm sm:text-base border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all disabled:opacity-50 disabled:bg-gray-100 pr-10 sm:pr-12"
      />
      <button
        type="button"
        onClick={() => setShowPassword(!showPassword)}
        disabled={loading}
        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-indigo-600 disabled:opacity-50 bg-transparent border-none cursor-pointer transition-colors"
      >
        {showPassword ? <EyeOff size={18} className="sm:w-5 sm:h-5" /> : <Eye size={18} className="sm:w-5 sm:h-5" />}
      </button>
    </div>

    <div className="flex items-center justify-between text-xs sm:text-sm">
      <label className="flex items-center gap-1.5 sm:gap-2 cursor-pointer">
        <input type="checkbox" className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded border-gray-300" />
        <span className="text-gray-600">Remember me</span>
      </label>
      <a href="#" className="text-indigo-600 hover:text-indigo-700 font-medium">Forgot password?</a>
    </div>
    
    <button 
      type="submit" // Changed from onClick to type="submit"
      className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white py-2.5 sm:py-3 px-4 rounded-lg hover:from-indigo-700 hover:to-blue-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold shadow-lg text-sm sm:text-base"
      disabled={loading}
    >
      {loading ? 'Logging in...' : 'Login'}
    </button>
    
    {message && (
      <div className="bg-green-50 border-2 border-green-300 text-green-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2">
        <CheckCircle size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
        <span>{message}</span>
      </div>
    )}
    {error && (
      <div className="bg-red-50 border-2 border-red-300 text-red-700 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-2">
        <AlertCircle size={16} className="sm:w-5 sm:h-5 flex-shrink-0" />
        <span>{error}</span>
      </div>
    )}
    
    <button 
      type="button" 
      onClick={testConnection} // Uses JWT testConnection function
      className="w-full text-xs sm:text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors py-2"
    >
      Test Connection
    </button>

    <p className="text-center text-gray-600 text-xs sm:text-sm pt-2">
      Don't have an account? <button type="button" onClick={() => setActiveForm('SignUp')} className="text-indigo-600 font-semibold hover:text-indigo-700">Sign up</button>
    </p>
  </form>
);

// -----------------------------------------------------------------
// Main Login Component
// Using JWT logic (from file 1) + STYLED layout (from file 2)
// -----------------------------------------------------------------
const Login = ({ activeTab }) => { // activeTab prop might be redundant now but keeping it
  const navigate = useNavigate();
  // State from your styled (second) file
  const [activeForm, setActiveForm] = useState('SignUp');
  const [activeSignUpTab, setActiveSignUpTab] = useState('Citizen');
  const [showPassword, setShowPassword] = useState(false);
  const [loginFormData, setLoginFormData] = useState({
    username: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // useEffect from your JWT (first) file
  // No need for CSRF initialization with JWT
  useEffect(() => {
    // You can add any initialization logic here if needed
    console.log('Login component mounted - JWT authentication');
    
    // Set active tab based on prop, if provided
    if (activeTab) {
        setActiveSignUpTab(activeTab);
    }
    // Set default active tab
    const availableTabs = ['Citizen', 'Government Authority', 'Field Worker', 'Admin'];
    if (availableTabs.includes(activeTab)) {
        setActiveSignUpTab(activeTab);
    } else {
        setActiveSignUpTab('Citizen'); // Default to Citizen
    }
  }, [activeTab]); // Added activeTab as dependency

  // handleLoginChange (same in both files)
  const handleLoginChange = (e) => {
    setLoginFormData({ 
      ...loginFormData, 
      [e.target.name]: e.target.value 
    });
  };

  // handleLoginSubmit from your JWT (first) file
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

  // testConnection from your JWT (first) file
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

  // renderSignUpForm from your styled (second) file
  const renderSignUpForm = () => {
    switch (activeSignUpTab) {
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

  // JSX Layout from your styled (second) file
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-3 sm:p-4 md:p-6 lg:p-8 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob"></div>
      <div className="absolute top-0 right-0 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-0 left-1/2 w-64 h-64 sm:w-80 sm:h-80 md:w-96 md:h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>

      <div className="relative z-10 w-full max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center">
          {/* Left Column - Info (Hidden on mobile) */}
          <div className="hidden lg:flex flex-col justify-center text-white space-y-6 lg:space-y-8">
            <div>
              <h1 className="text-4xl lg:text-5xl font-bold mb-2 lg:mb-3">Smart Complaints</h1>
              <p className="text-lg lg:text-xl text-indigo-200 font-semibold">Your Voice, Our Priority</p>
            </div>

            <div className="space-y-4 lg:space-y-6">
              <div className="flex items-start gap-3 lg:gap-4 group">
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-gradient-to-r from-indigo-500 to-blue-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                  <span className="text-xl lg:text-2xl">📋</span>
                </div>
                <div>
                  <h3 className="font-bold text-base lg:text-lg mb-1">Easy Reporting</h3>
                  <p className="text-indigo-200 text-sm lg:text-base">Report issues directly with detailed information and photos</p>
                </div>
              </div>

              <div className="flex items-start gap-3 lg:gap-4 group">
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                  <span className="text-xl lg:text-2xl">🔍</span>
                </div>
                <div>
                  <h3 className="font-bold text-base lg:text-lg mb-1">Real-time Tracking</h3>
                  <p className="text-indigo-200 text-sm lg:text-base">Monitor your complaints status in real-time</p>
                </div>
              </div>

              <div className="flex items-start gap-3 lg:gap-4 group">
                <div className="w-12 h-12 lg:w-14 lg:h-14 rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform shadow-lg">
                  <span className="text-xl lg:text-2xl">🤝</span>
                </div>
                <div>
                  <h3 className="font-bold text-base lg:text-lg mb-1">Quick Resolution</h3>
                  <p className="text-indigo-200 text-sm lg:text-base">Direct communication with authorities for faster solutions</p>
                </div>
              </div>
            </div>

            </div>

          {/* Right Column - Forms */}
          <div className="w-full">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-4 sm:mb-6">
              <div className="inline-block bg-gradient-to-r from-indigo-500 to-blue-500 p-2.5 sm:p-3 rounded-full mb-2 sm:mb-3 shadow-2xl">
                <Shield size={28} className="sm:w-8 sm:h-8 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-white mb-1">Smart Complaints</h1>
              <p className="text-sm sm:text-base text-indigo-200 font-semibold">Your Voice, Our Priority</p>
            </div>

            <div className="bg-white bg-opacity-95 backdrop-blur rounded-xl sm:rounded-2xl shadow-2xl p-4 sm:p-6 md:p-8">
              {/* Form Toggle */}
              <div className="flex gap-2 sm:gap-3 mb-4 sm:mb-6 md:mb-8 border-b-2 border-gray-200 pb-3 sm:pb-4">
                <button
                  onClick={() => setActiveForm('Login')}
                  className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 font-semibold transition-all duration-300 rounded-lg text-xs sm:text-sm md:text-base ${
                    activeForm === 'Login' 
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setActiveForm('SignUp')}
                  className={`flex-1 py-2 sm:py-2.5 px-3 sm:px-4 font-semibold transition-all duration-300 rounded-lg text-xs sm:text-sm md:text-base ${
                    activeForm === 'SignUp' 
                      ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  SignUp
                </button>
              </div>

              {/* Login Form */}
              {activeForm === 'Login' ? (
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-4 sm:mb-6 text-center">Welcome Back</h2>
                  <LoginForm 
                    loginFormData={loginFormData}
                    handleLoginChange={handleLoginChange}
                    handleLoginSubmit={handleLoginSubmit} // Passing JWT handler
                    showPassword={showPassword}
                    setShowPassword={setShowPassword}
                    loading={loading}
                    message={message}
                    error={error}
                    testConnection={testConnection} // Passing JWT handler
                    setActiveForm={setActiveForm}
                  />
                </div>
              ) : (
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold text-gray-800 mb-1 sm:mb-2 text-center">Create Account</h2>
                  <p className="text-gray-600 text-center mb-4 sm:mb-6 text-xs sm:text-sm">Select your user type and register</p>

                  {/* SignUp Form Tabs */}
                  <div className="flex gap-1.5 sm:gap-2 mb-4 sm:mb-6 overflow-x-auto pb-2 scrollbar-hide">
                    {['Citizen', 'Government Authority', 'Field Worker', 'Admin'].map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveSignUpTab(tab)}
                        className={`px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-lg whitespace-nowrap font-medium text-xs sm:text-sm transition-all ${
                          activeSignUpTab === tab
                            ? 'bg-gradient-to-r from-indigo-600 to-blue-600 text-white shadow-lg'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {tab}
                      </button>
                    ))}
                  </div>
                  
                  {/* SignUp Form Content */} 
                  <div className="max-h-[50vh] sm:max-h-96 overflow-y-auto">
                    {renderSignUpForm()}
                  </div>

                  <p className="text-center text-gray-600 text-xs sm:text-sm mt-4 sm:mt-6">
                    Already have an account? <button onClick={() => setActiveForm('Login')} className="text-indigo-600 font-semibold hover:text-indigo-700">Login</button>
                  </p>
                </div>
              )}
            </div>

            {/* Mobile Footer */}
            <div className="lg:hidden mt-4 sm:mt-6 text-center text-indigo-200 text-xs sm:text-sm">
              <p>Secure • Transparent • Citizen-Focused</p>
            </div>
          </div>
        </div>

        {/* Desktop Footer */}
        <div className="hidden lg:block mt-6 lg:mt-8 text-center text-indigo-200 text-sm">
          <p>Secure • Transparent • Citizen-Focused</p>
        </div>
      </div>
    </div>
  );
};

export default Login;