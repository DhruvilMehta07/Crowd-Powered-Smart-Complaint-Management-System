import React, { useState } from 'react';
import axios from 'axios';


const LoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    try {
      const res = await axios.post("http://localhost:7000/users/login/", {
        username: formData.username,
        password: formData.password,
      });
      setMessage(res.data.message || "Login successful!");
      // Optionally, redirect or update app state here
    } catch (err) {
      console.log(err.response?.data); // Add this line
      setError(
        err.response?.data?.error ||
        (typeof err.response?.data === 'object'
          ? JSON.stringify(err.response.data)
          : "Login failed")
      );
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="input-group">
        <input
          type="text"
          name="username"
          placeholder="Enter your username"
          value={formData.username}
          onChange={handleChange}
          required
        />
      </div>
      <div className="input-group">
        <input
          type={showPassword ? 'text' : 'password'}
          name="password"
          placeholder="Enter Password"
          value={formData.password}
          onChange={handleChange}
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
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
    </form>
  );
};

export default LoginForm;