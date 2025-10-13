import React, { useState, useEffect } from 'react';
import axios from 'axios';
axios.defaults.xsrfCookieName = 'csrftoken';
axios.defaults.xsrfHeaderName = 'X-CSRFToken';
axios.defaults.withCredentials = true;

const GovtAuthSignUpForm = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [showReenterPassword, setShowReenterPassword] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [isOtherSelected, setIsOtherSelected] = useState(false);

    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        reenterPassword: '',
        phone_number: '',
        assigned_department: '',
        new_department: '',
    });

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Fetch departments from backend
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const res = await axios.get("http://localhost:7000/users/departments/");
                setDepartments(res.data);
            } catch (err) {
                console.error("Error fetching departments:", err);
            }
        };
        fetchDepartments();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;

        if (name === "assigned_department") {
            if (value === "other") {
                setIsOtherSelected(true);
                setFormData({ ...formData, assigned_department: "", new_department: "" });
            } else {
                setIsOtherSelected(false);
                setFormData({ ...formData, assigned_department: value, new_department: "" });
            }
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');
        setError('');
        setLoading(true);

        if (formData.password !== formData.reenterPassword) {
            setError("Passwords do not match");
            setLoading(false);
            return;
        }

        try {
            let departmentToSend;

            if (isOtherSelected) {
                const deptRes = await axios.post("http://localhost:7000/users/departments/", {
                    name: formData.new_department
                });
                departmentToSend = deptRes.data.id;
            } else {
                departmentToSend = formData.assigned_department;
            }

            const res = await axios.post("http://localhost:7000/users/signup/authorities/", {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                phone_number: formData.phone_number,
                assigned_department_id: departmentToSend,
            });

            setMessage(res.data.message || "Signup successful!");
            setFormData({
                username: '', email: '', password: '', reenterPassword: '',
                phone_number: '', assigned_department: '', new_department: ''
            });
            setIsOtherSelected(false);
        } catch (err) {
            setError(err.response?.data?.error ||
                (typeof err.response?.data === 'object' ? JSON.stringify(err.response.data) : "Signup failed"));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-wrapper">
            <form onSubmit={handleSubmit} className="auth-form">
                <div className="mb-4">
                    <input
                        type="text"
                        name="username"
                        placeholder="Enter your Name"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                    />
                </div>
                
                <div className="mb-4">
                    <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                    />
                </div>
                
                <div className="mb-4 relative">
                    <input
                        type={showPassword ? 'text' : 'password'}
                        name="password"
                        placeholder="Enter Password"
                        value={formData.password}
                        onChange={handleChange}
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
                
                <div className="mb-4 relative">
                    <input
                        type={showReenterPassword ? 'text' : 'password'}
                        name="reenterPassword"
                        placeholder="Re-enter Password"
                        value={formData.reenterPassword}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50 pr-12"
                    />
                    <button
                        type="button"
                        onClick={() => setShowReenterPassword(!showReenterPassword)}
                        disabled={loading}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50 bg-transparent border-none cursor-pointer"
                    >
                        {showReenterPassword ? '🙈' : '👁️'}
                    </button>
                </div>
                
                <div className="mb-4">
                    <input
                        type="tel"
                        name="phone_number"
                        placeholder="Enter Mobile Number"
                        value={formData.phone_number}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                    />
                </div>
                
                <div className="mb-4">
                    <select
                        name="assigned_department"
                        value={formData.assigned_department || (isOtherSelected ? "other" : "")}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                    >
                        <option value="" disabled>Select Department</option>
                        {departments.map((dept) => (
                            <option key={dept.id} value={dept.id}>{dept.name}</option>
                        ))}
                        <option value="other">Other</option>
                    </select>
                </div>

                {isOtherSelected && (
                    <div className="mb-6">
                        <input
                            type="text"
                            name="new_department"
                            placeholder="Enter new department"
                            value={formData.new_department}
                            onChange={handleChange}
                            required
                            disabled={loading}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:opacity-50"
                        />
                    </div>
                )}

                {message && (
                    <div className="success-message mb-4 p-3 bg-green-100 text-green-700 rounded-lg">
                        {message}
                    </div>
                )}
                {error && (
                    <div className="error-message mb-4 p-3 bg-red-100 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                <button 
                    type="submit" 
                    className="login-btn w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                    disabled={loading}
                >
                    {loading ? 'Signing Up...' : 'SignUp'}
                </button>
            </form>
        </div>
    );
};

export default GovtAuthSignUpForm;