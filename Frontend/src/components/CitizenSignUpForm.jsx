import React, { useState } from "react";
import { toast } from "react-hot-toast";
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import AuthApp from './App'
import HomeApp from '../src_home/App'
import './index.css'

export default function SignupForm() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    mobile: "",
    otp: "",
  });

  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [loading, setLoading] = useState(false);

  // Update input values
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Simulated Send OTP API
  const handleSendOtp = async () => {
    if (!formData.mobile) {
      toast.error("Please enter your mobile number first");
      return;
    }
    setLoading(true);
    try {
      // Replace with your actual API call
      await new Promise((res) => setTimeout(res, 1000));
      setOtpSent(true);
      toast.success("OTP sent to your number");
    } catch (err) {
      toast.error("Failed to send OTP");
    }
    setLoading(false);
  };

  // Simulated Verify OTP API
  const handleVerifyOtp = async () => {
    if (!formData.otp) {
      toast.error("Please enter OTP");
      return;
    }
    setLoading(true);
    try {
      // Replace with actual verification API call
      await new Promise((res) => setTimeout(res, 1000));

      if (formData.otp === "1234") {
        setOtpVerified(true);
        toast.success("OTP Verified ✅");
      } else {
        setOtpVerified(false);
        toast.error("Invalid OTP ❌");
      }
    } catch (err) {
      toast.error("OTP verification failed");
    }
    setLoading(false);
  };

  // Final Signup API
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!otpVerified) {
      toast.error("Please verify OTP before signing up");
      return;
    }
    // Add password validation checks as needed
    setLoading(true);
    try {
      // Replace with actual signup API call
      await new Promise((res) => setTimeout(res, 1000));
      toast.success("Signup successful 🎉");
    } catch (err) {
      toast.error("Signup failed");
    }
    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSignup}
      className="flex flex-col gap-4 p-6 w-full max-w-md mx-auto"
    >
      <input
        type="text"
        name="name"
        placeholder="Enter your Name"
        value={formData.name}
        onChange={handleChange}
        className="border-b outline-none p-2"
      />

      <input
        type="email"
        name="email"
        placeholder="Enter your email"
        value={formData.email}
        onChange={handleChange}
        className="border-b outline-none p-2"
      />

      <input
        type="password"
        name="password"
        placeholder="Enter Password"
        value={formData.password}
        onChange={handleChange}
        className="border-b outline-none p-2"
      />

      <input
        type="password"
        name="confirmPassword"
        placeholder="Re-enter Password"
        value={formData.confirmPassword}
        onChange={handleChange}
        className="border-b outline-none p-2"
      />

      <div className="flex gap-2 items-center">
        <input
          type="text"
          name="mobile"
          placeholder="Enter Mobile Number"
          value={formData.mobile}
          onChange={handleChange}
          className="border-b outline-none p-2 flex-1"
        />
        <button
          type="button"
          onClick={handleSendOtp}
          disabled={loading}
          className="bg-blue-500 text-white px-3 py-1 rounded disabled:opacity-50"
        >
          {otpSent ? "Resend OTP" : "Send OTP"}
        </button>
      </div>

      {otpSent && (
        <div className="flex gap-2 items-center">
          <input
            type="text"
            name="otp"
            placeholder="Enter OTP"
            value={formData.otp}
            onChange={handleChange}
            className={`border-b outline-none p-2 flex-1 ${
              otpVerified ? "border-green-500" : ""
            }`}
          />
          <button
            type="button"
            onClick={handleVerifyOtp}
            disabled={loading}
            className="bg-green-500 text-white px-3 py-1 rounded disabled:opacity-50"
          >
            Verify OTP
          </button>
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="bg-black text-white py-2 rounded disabled:opacity-50 mt-2"
      >
        Sign Up
      </button>
    </form>
  );
}
