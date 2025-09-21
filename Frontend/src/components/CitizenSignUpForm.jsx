import React, { useState } from 'react';


const CitizenSignUpForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showReenterPassword, setShowReenterPassword] = useState(false);

  return (
    <form>
      <div className="input-group">
        <input type="text" placeholder="Enter your Name" required />
      </div>
      <div className="input-group">
        <input type="email" placeholder="Enter your email" required />
      </div>
      <div className="input-group">
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter Password"
          required
        />
        <span className="password-toggle" onClick={() => setShowPassword(!showPassword)}>👁️</span>
      </div>
      <div className="input-group">
        <input
          type={showReenterPassword ? 'text' : 'password'}
          placeholder="Re-enter Password"
          required
        />
        <span className="password-toggle" onClick={() => setShowReenterPassword(!showReenterPassword)}>👁️</span>
      </div>
      <div className="input-group">
        <input type="tel" placeholder="Enter Mobile Number" required />
      </div>
      <button type="submit" className="login-btn">
        SignUp
      </button>
    </form>
  );
};

export default CitizenSignUpForm;