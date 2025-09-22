import React, { useState } from 'react';
import axios from 'axios';

const GovtAuthSignUpForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showReenterPassword, setShowReenterPassword] = useState(false);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        reenterPassword: '',
        phone_number: '',
        department: '',
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        if (formData.password !== formData.reenterPassword) {
            setError("Passwords do not match");
            return;
        }
        try {
            const res = await axios.post("http://localhost:7000/users/signup/authorities/", {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                phone_number: formData.phone_number,
                department: formData.department,
            });
            setMessage(res.data.message || "Signup successful!");
            setFormData({ username: '', email: '', password: '', reenterPassword: '', phone_number: '', department: '' });
        } catch (err) {
            setError(err.response?.data?.error || (typeof err.response?.data === 'object' ? JSON.stringify(err.response.data) : "Signup failed"));
        }
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="input-group">
                <input
                    type="text"
                    name="username"
                    placeholder="Enter your Name"
                    value={formData.username}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="input-group">
                <input
                    type="email"
                    name="email"
                    placeholder="Enter your email"
                    value={formData.email}
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
                <span className="password-toggle" onClick={() => setShowPassword(!showPassword)}>👁️</span>
            </div>
            <div className="input-group">
                <input
                    type={showReenterPassword ? 'text' : 'password'}
                    name="reenterPassword"
                    placeholder="Re-enter Password"
                    value={formData.reenterPassword}
                    onChange={handleChange}
                    required
                />
                <span className="password-toggle" onClick={() => setShowReenterPassword(!showReenterPassword)}>👁️</span>
            </div>
            <div className="input-group">
                <input
                    type="tel"
                    name="phone_number"
                    placeholder="Enter Mobile Number"
                    value={formData.phone_number}
                    onChange={handleChange}
                    required
                />
            </div>
            <div className="input-group">
                <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    required
                >
                    <option value="" disabled>Department</option>
                    <option value="water">Water Supply</option>
                    <option value="electricity">Electricity</option>
                    <option value="roads">Roads and Transport</option>
                </select>
            </div>
            {message && <div style={{ color: 'green' }}>{message}</div>}
            {error && <div style={{ color: 'red' }}>{error}</div>}
            <button type="submit" className="login-btn">
                SignUp
            </button>
        </form>
    );
};

export default GovtAuthSignUpForm;