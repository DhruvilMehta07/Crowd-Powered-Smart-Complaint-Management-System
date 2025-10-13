import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import googleLogo from '../assets/google-logo.svg';

// Import the signup form components only
import CitizenSignUpForm from './CitizenSignUpForm';
import GovtAuthSignUpForm from './GovtAuthSignUpForm';
import FieldWorkerSignUpForm from './FieldWorkerSignUpForm';
import AdminSignUpForm from './AdminSignUpForm';

// Configure axios for CSRF
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

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

  // Login form handlers
  const handleLoginChange = (e) => {
    setLoginFormData({ ...loginFormData, [e.target.name]: e.target.value });
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setLoading(true);

    try {
      const res = await axios.post("http://localhost:7000/users/login/", {
        username: loginFormData.username,
        password: loginFormData.password,
      });

      if (res.data.message) {
        setMessage(`Login successful`);
        
        // Store user info in localStorage (no token needed for session auth)
        localStorage.setItem('user_id', res.data.user_id);
        localStorage.setItem('username', res.data.username);
        localStorage.setItem('isAuthenticated', 'true');
        
        navigate('/home');
      }
    } catch (err) {
      console.log(err.response?.data);
      setError(
        err.response?.data?.error || 'Login failed'
      );
    } finally {
      setLoading(false);
    }
  };

  // Login Form Component (now inside the same file)
  const LoginForm = () => (
    <form onSubmit={handleLoginSubmit} className="auth-form">
      <div className="input-group relative">
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
      
      <div className="input-group relative">
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
          className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50 bg-transparent border-none cursor-pointer"
        >
          {showPassword ? '🙈' : '👁️'}
        </button>
      </div>
      
      <button 
        type="submit" 
        className="login-btn w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        disabled={loading}
      >
        {loading ? 'Logging in...' : 'Login'}
      </button>
      
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
    </form>
  );

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
      {activeForm === 'Login' ? <LoginForm /> : renderSignUpForm()}

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