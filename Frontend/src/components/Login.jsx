import React, { useState } from 'react';
import './Login.css';
import googleLogo from '../assets/google-logo.svg';

// Import the specific form components
import LoginForm from './LoginForm';
import CitizenSignUpForm from './CitizenSignUpForm';
import GovtAuthSignUpForm from './GovtAuthSignUpForm';
import FieldWorkerSignUpForm from './FieldWorkerSignUpForm';
import AdminSignUpForm from './AdminSignUpForm';

// The component now accepts `activeTab` as a prop from App.jsx
const Login = ({ activeTab }) => {
  const [activeForm, setActiveForm] = useState('SignUp');

  // This function decides which SignUp form to render based on the prop
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
    // We remove the main "login-container" div and the header-tabs section
    // because the styling and structure are now handled by App.jsx and Navbar.jsx
    <div className="form-content-area">
      <div className="form-toggle">
        <h2
          className={activeForm === 'Login' ? 'active' : ''}
          onClick={() => setActiveForm('Login')}
        >
          Login
        </h2>
        <h2
          className={activeForm === 'SignUp' ? 'active' : ''}
          onClick={() => setActiveForm('SignUp')}
        >
          SignUp
        </h2>
      </div>

      {/* Render the correct form based on state */}
      {activeForm === 'Login' ? <LoginForm /> : renderSignUpForm()}

      <div className="divider">Or</div>

      <div className="google-login">
        <img src={googleLogo} alt="Google sign-in" />
      </div>
    </div>
  );
};

export default Login;
