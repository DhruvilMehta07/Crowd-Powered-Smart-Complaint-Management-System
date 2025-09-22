import React, { useState, useEffect } from 'react';
import axios from 'axios';

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
        assigned_department: '', // will hold department PK
        new_department: '',
    });

    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    // Fetch departments from backend (returns list of {id, name})
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const res = await axios.get("http://localhost:7000/users/departments/");
                setDepartments(res.data); // expect: [{id:1, name:"Water Supply"}, ...]
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

        if (formData.password !== formData.reenterPassword) {
            setError("Passwords do not match");
            return;
        }

        try {
            let departmentToSend;

            if (isOtherSelected) {
                // Create new department first
                const deptRes = await axios.post("http://localhost:7000/users/departments/", {
                    name: formData.new_department
                });
                departmentToSend = deptRes.data.id; // get new department PK
            } else {
                departmentToSend = formData.assigned_department; // already a PK
            }

            const res = await axios.post("http://localhost:7000/users/signup/authorities/", {
                username: formData.username,
                email: formData.email,
                password: formData.password,
                phone_number: formData.phone_number,
                assigned_department_id: departmentToSend, // send PK
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
                    name="assigned_department"
                    value={formData.assigned_department || (isOtherSelected ? "other" : "")}
                    onChange={handleChange}
                    required
                >
                    <option value="" disabled>Select Department</option>
                    {departments.map((dept) => (
                        <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                    <option value="other">Other</option>
                </select>
            </div>

            {isOtherSelected && (
                <div className="input-group">
                    <input
                        type="text"
                        name="new_department"
                        placeholder="Enter new department"
                        value={formData.new_department}
                        onChange={handleChange}
                        required
                    />
                </div>
            )}

            {message && <div className="success-message">{message}</div>}
            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-btn">
                SignUp
            </button>

        </form>
    );
};

export default GovtAuthSignUpForm;
