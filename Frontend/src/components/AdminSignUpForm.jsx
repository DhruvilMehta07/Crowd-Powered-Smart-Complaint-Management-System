import React, { useState } from 'react';

const AdminSignUpForm = () => {
    const [showPassword, setShowPassword] = useState(false);

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
            <button type="submit" className="login-btn">
                SignUp
            </button>
        </form>
    );
};

export default AdminSignUpForm;