import React, { useState } from 'react';

const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <form className='form-input'>
      <div className="input-group">
        <input type="email" placeholder="Enter your email" required />
      </div>
      <div className="input-group">
        <input
          type={showPassword ? 'text' : 'password'}
          placeholder="Enter Password"
          required
        />
        <span
          className="password-toggle"
          onClick={() => setShowPassword(!showPassword)}
        >
          👁️
        </span>
      </div>
      <button type="submit" className="login-btn">
        Login
      </button>
      <a href="#" className="forgot-password">
        Forgot Password?
      </a>
    </form>
  );
};

export default LoginForm;