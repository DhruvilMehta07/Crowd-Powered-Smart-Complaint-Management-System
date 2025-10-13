import React, { useState } from 'react';
import './Login.css';
import googleLogo from '../assets/google-logo.svg';

// Import the specific form components
import LoginForm from './LoginForm';
import CitizenSignUpForm from './CitizenSignUpForm';
import GovtAuthSignUpForm from './GovtAuthSignUpForm';
import FieldWorkerSignUpForm from './FieldWorkerSignUpForm';
import AdminSignUpForm from './AdminSignUpForm';

const Login = ({ activeTab }) => {
  const [activeForm, setActiveForm] = useState('SignUp');

  const renderSignUpForm = () => {
    switch (activeTab) {
      case 'Citizen':
        return <CitizenSignUpForm />;
      case 'Government Authority':
        return <GovtAuthSignUpForm />;
      case 'Field Worker':
        return <FieldWorkerSignUpForm />;
      case 'Administrator':
        return <AdminSignUpForm />;
      default:
        return <CitizenSignUpForm />;
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Form Toggle */}
      <div className="flex border-b border-gray-200 mb-6">
        <button
          className={`flex-1 py-4 font-semibold text-center border-b-2 transition-colors ${
            activeForm === 'Login' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveForm('Login')}
        >
          Login
        </button>
        <button
          className={`flex-1 py-4 font-semibold text-center border-b-2 transition-colors ${
            activeForm === 'SignUp' 
              ? 'border-blue-600 text-blue-600' 
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
          onClick={() => setActiveForm('SignUp')}
        >
          SignUp
        </button>
      </div>

      {/* Render the correct form */}
      {activeForm === 'Login' ? <LoginForm /> : renderSignUpForm()}

      {/* Divider */}
      <div className="px-6">
        <div className="relative flex items-center py-6">
          <div className="flex-grow border-t border-gray-300"></div>
          <span className="flex-shrink mx-4 text-gray-500">Or</span>
          <div className="flex-grow border-t border-gray-300"></div>
        </div>

        {/* Google Login */}
        <div className="flex justify-center items-center p-4 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors mb-6">
          <img
            src={googleLogo}
            alt="Google sign-in"
            className="w-5 h-5 mr-3"
          />
          <span className="text-gray-700 font-medium">Continue with Google</span>
        </div>
      </div>
    </div>
  );
};

export default Login;