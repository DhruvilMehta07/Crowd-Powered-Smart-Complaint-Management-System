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

      if (res.data.message) {
            setMessage(`Login successful`);
        }
    } catch (err) {
      console.log(err.response?.data);
      setError(
        err.response.data.error
      );
      setMessage(""); // clear previous messages
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
      
      {message && <div className="success-message">{message}</div>}
      {error && <div className="error-message">{error}</div>}
    </form>
  );
};

export default LoginForm;