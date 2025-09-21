import React, { useState } from 'react';

const MaintenanceCrewSignUpForm = () => {
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
            <div className="input-group">
                <select required>
                    <option value="" disabled selected>Department</option>
                    <option value="water">Water Supply</option>
                    <option value="electricity">Electricity</option>
                    <option value="roads">Roads and Transport</option>
                </select>
            </div>
            <div className="input-group">
                <select required>
                    <option value="" disabled selected>Assigned Ward</option>
                    <option value="ward1">Ward 1</option>
                    <option value="ward2">Ward 2</option>
                    <option value="ward3">Ward 3</option>
                </select>
            </div>
            <button type="submit" className="login-btn">
                SignUp
            </button>
        </form>
    );
};

export default MaintenanceCrewSignUpForm;