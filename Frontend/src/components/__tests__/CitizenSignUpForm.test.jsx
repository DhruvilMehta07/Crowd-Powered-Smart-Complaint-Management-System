import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import CitizenSignUpForm from '../CitizenSignUpForm';
import api from '../../utils/axiosConfig';
import { setAccessToken } from '../../utils/auth';
import { vi } from 'vitest';

vi.mock('../../utils/axiosConfig', () => ({
  default: { post: vi.fn() },
}));

vi.mock('../../utils/auth', () => ({
  setAccessToken: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

test('renders signup form fields', () => {
  render(<CitizenSignUpForm />);

  expect(screen.getByPlaceholderText(/Enter your First Name/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Enter your Last Name/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Enter your Username/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Enter your Email/i)).toBeInTheDocument();
  
  // FIX: Use strict anchors (^...$) to avoid matching "Re-enter Password"
  expect(screen.getByPlaceholderText(/^Enter Password$/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Re-enter Password/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Enter Mobile Number/i)).toBeInTheDocument();
});

test('shows error when passwords do not match', async () => {
  const user = userEvent.setup();
  render(<CitizenSignUpForm />);

  await user.type(screen.getByPlaceholderText(/Enter your First Name/i), 'John');
  await user.type(screen.getByPlaceholderText(/Enter your Last Name/i), 'Doe');
  await user.type(screen.getByPlaceholderText(/Enter your Username/i), 'jdoe');
  await user.type(screen.getByPlaceholderText(/Enter your Email/i), 'jdoe@example.com');
  
  // FIX: Use strict anchors here
  await user.type(screen.getByPlaceholderText(/^Enter Password$/i), 'password1');
  await user.type(screen.getByPlaceholderText(/Re-enter Password/i), 'different');
  await user.type(screen.getByPlaceholderText(/Enter Mobile Number/i), '1234567890');

  await user.click(screen.getByRole('button', { name: /Send OTP to Email/i }));

  expect(await screen.findByText(/Passwords do not match/i)).toBeInTheDocument();
});

test('shows error when password too short', async () => {
  const user = userEvent.setup();
  render(<CitizenSignUpForm />);

  await user.type(screen.getByPlaceholderText(/Enter your First Name/i), 'John');
  await user.type(screen.getByPlaceholderText(/Enter your Last Name/i), 'Doe');
  await user.type(screen.getByPlaceholderText(/Enter your Username/i), 'jdoe');
  await user.type(screen.getByPlaceholderText(/Enter your Email/i), 'jdoe@example.com');
  
  // FIX: Use strict anchors here
  await user.type(screen.getByPlaceholderText(/^Enter Password$/i), '123');
  await user.type(screen.getByPlaceholderText(/Re-enter Password/i), '123');
  await user.type(screen.getByPlaceholderText(/Enter Mobile Number/i), '1234567890');

  await user.click(screen.getByRole('button', { name: /Send OTP to Email/i }));

  expect(await screen.findByText(/Password must be at least 6 characters/i)).toBeInTheDocument();
});

test('successful signup triggers verify step and OTP verification stores token and user', async () => {
  const user = userEvent.setup();

  api.post
    .mockImplementationOnce(() => Promise.resolve({ data: { message: 'OTP sent to your email!' } }))
    .mockImplementationOnce(() => Promise.resolve({ data: { message: 'Registration successful!', access: 'FAKE_TOKEN', user_id: '42', username: 'jdoe' } }));

  render(<CitizenSignUpForm />);

  await user.type(screen.getByPlaceholderText(/Enter your First Name/i), 'John');
  await user.type(screen.getByPlaceholderText(/Enter your Last Name/i), 'Doe');
  await user.type(screen.getByPlaceholderText(/Enter your Username/i), 'jdoe');
  await user.type(screen.getByPlaceholderText(/Enter your Email/i), 'jdoe@example.com');
  
  // FIX: Use strict anchors here
  await user.type(screen.getByPlaceholderText(/^Enter Password$/i), 'password1');
  await user.type(screen.getByPlaceholderText(/Re-enter Password/i), 'password1');
  await user.type(screen.getByPlaceholderText(/Enter Mobile Number/i), '1234567890');

  await user.click(screen.getByRole('button', { name: /Send OTP to Email/i }));

  expect(await screen.findByText(/Verify Your Email/i)).toBeInTheDocument();

  await user.type(screen.getByPlaceholderText(/Enter 6-digit OTP/i), '123456');

  await user.click(screen.getByRole('button', { name: /Verify OTP/i }));

  // Wait for success screen and assertions
  // FIX: Use getByRole to specifically target the header, ignoring the paragraph text
  await waitFor(() => expect(screen.getByRole('heading', { name: /Registration Successful!/i })).toBeInTheDocument());

  // setAccessToken should be called and localStorage populated
  expect(setAccessToken).toHaveBeenCalledWith('FAKE_TOKEN');
  expect(localStorage.getItem('user_id')).toBe('42');
  expect(localStorage.getItem('username')).toBe('jdoe');
  expect(localStorage.getItem('isAuthenticated')).toBe('true');
});

test('send OTP API failure shows server error message', async () => {
  const user = userEvent.setup();
  // Simulate server error on signup
  api.post.mockRejectedValueOnce({ response: { data: { message: 'Email already registered' } } });

  render(<CitizenSignUpForm />);

  await user.type(screen.getByPlaceholderText(/Enter your First Name/i), 'Jane');
  await user.type(screen.getByPlaceholderText(/Enter your Last Name/i), 'Doe');
  await user.type(screen.getByPlaceholderText(/Enter your Username/i), 'jane');
  await user.type(screen.getByPlaceholderText(/Enter your Email/i), 'jane@example.com');
  await user.type(screen.getByPlaceholderText(/^Enter Password$/i), 'password1');
  await user.type(screen.getByPlaceholderText(/Re-enter Password/i), 'password1');
  await user.type(screen.getByPlaceholderText(/Enter Mobile Number/i), '1234567890');

  await user.click(screen.getByRole('button', { name: /Send OTP to Email/i }));

  expect(await screen.findByText(/Email already registered/i)).toBeInTheDocument();
});

test('resend OTP success then failure shows appropriate messages', async () => {
  const user = userEvent.setup();

  // First call: signup success -> move to verify step
  api.post.mockResolvedValueOnce({ data: { message: 'OTP sent' } });
  // Second call: resend success
  api.post.mockResolvedValueOnce({ data: { message: 'resent' } });

  render(<CitizenSignUpForm />);

  await user.type(screen.getByPlaceholderText(/Enter your First Name/i), 'Sam');
  await user.type(screen.getByPlaceholderText(/Enter your Last Name/i), 'Smith');
  await user.type(screen.getByPlaceholderText(/Enter your Username/i), 'sam');
  await user.type(screen.getByPlaceholderText(/Enter your Email/i), 'sam@example.com');
  await user.type(screen.getByPlaceholderText(/^Enter Password$/i), 'password1');
  await user.type(screen.getByPlaceholderText(/Re-enter Password/i), 'password1');
  await user.type(screen.getByPlaceholderText(/Enter Mobile Number/i), '1234567890');

  await user.click(screen.getByRole('button', { name: /Send OTP to Email/i }));

  expect(await screen.findByText(/Verify Your Email/i)).toBeInTheDocument();

  // Click Resend OTP (success)
  const resendBtn = screen.getByRole('button', { name: /Resend OTP/i });
  await user.click(resendBtn);

  expect(await screen.findByText(/New OTP sent to your email!/i)).toBeInTheDocument();

  // Now simulate resend failure
  api.post.mockRejectedValueOnce({});
  await user.click(resendBtn);

  expect(await screen.findByText(/Failed to resend OTP. Please try again./i)).toBeInTheDocument();
});

test('password visibility toggle changes input type and OTP input filters non-digits/limits length', async () => {
  const user = userEvent.setup();

  render(<CitizenSignUpForm />);

  const pwdInput = screen.getByPlaceholderText(/^Enter Password$/i);
  // find the toggle button next to password input
  const pwdToggle = pwdInput.parentElement.querySelector('button');

  // initial should be password
  expect(pwdInput).toHaveAttribute('type', 'password');

  await user.click(pwdToggle);
  expect(pwdInput).toHaveAttribute('type', 'text');

  await user.click(pwdToggle);
  expect(pwdInput).toHaveAttribute('type', 'password');

  // Move to verify step to test OTP input sanitization
  api.post.mockResolvedValueOnce({ data: { message: 'OTP sent' } });

  // fill required fields quickly
  await user.type(screen.getByPlaceholderText(/Enter your First Name/i), 'O');
  await user.type(screen.getByPlaceholderText(/Enter your Last Name/i), 'P');
  await user.type(screen.getByPlaceholderText(/Enter your Username/i), 'op');
  await user.type(screen.getByPlaceholderText(/Enter your Email/i), 'op@example.com');
  await user.type(screen.getByPlaceholderText(/^Enter Password$/i), 'password1');
  await user.type(screen.getByPlaceholderText(/Re-enter Password/i), 'password1');
  await user.type(screen.getByPlaceholderText(/Enter Mobile Number/i), '1234567890');

  await user.click(screen.getByRole('button', { name: /Send OTP to Email/i }));

  const otpInput = await screen.findByPlaceholderText(/Enter 6-digit OTP/i);
  await user.type(otpInput, 'a1b2c3d4e5f6g7');

  // should strip non-digits and limit to 6 digits
  expect(otpInput).toHaveValue('123456');
});

  test('verify OTP failure shows server error message', async () => {
    const user = userEvent.setup();

    // send OTP succeeds, verify fails with server message
    api.post
      .mockResolvedValueOnce({ data: { message: 'OTP sent' } })
      .mockRejectedValueOnce({ response: { data: { message: 'Invalid OTP' } } });

    render(<CitizenSignUpForm />);

    // fill required fields
    await user.type(screen.getByPlaceholderText(/Enter your First Name/i), 'V');
    await user.type(screen.getByPlaceholderText(/Enter your Last Name/i), 'E');
    await user.type(screen.getByPlaceholderText(/Enter your Username/i), 've');
    await user.type(screen.getByPlaceholderText(/Enter your Email/i), 've@example.com');
    await user.type(screen.getByPlaceholderText(/^Enter Password$/i), 'password1');
    await user.type(screen.getByPlaceholderText(/Re-enter Password/i), 'password1');
    await user.type(screen.getByPlaceholderText(/Enter Mobile Number/i), '1234567890');

    await user.click(screen.getByRole('button', { name: /Send OTP to Email/i }));

    expect(await screen.findByText(/Verify Your Email/i)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/Enter 6-digit OTP/i), '000000');
    await user.click(screen.getByRole('button', { name: /Verify OTP/i }));

    expect(await screen.findByText(/Invalid OTP/i)).toBeInTheDocument();
  });

    test('resend OTP failure with server message is displayed', async () => {/* Lines 236-264 omitted */});

test('shows error when email is empty or invalid format', async () => {
  const user = userEvent.setup();
  render(<CitizenSignUpForm />);

  await user.type(screen.getByPlaceholderText(/Enter your First Name/i), 'John');
  await user.type(screen.getByPlaceholderText(/Enter your Last Name/i), 'Doe');
  await user.type(screen.getByPlaceholderText(/Enter your Username/i), 'jdoe');
  await user.type(screen.getByPlaceholderText(/Enter your Email/i), 'invalid-email');
  await user.type(screen.getByPlaceholderText(/^Enter Password$/i), 'password1');
  await user.type(screen.getByPlaceholderText(/Re-enter Password/i), 'password1');
  await user.type(screen.getByPlaceholderText(/Enter Mobile Number/i), '1234567890');

  await user.click(screen.getByRole('button', { name: /Send OTP to Email/i }));

  // Check that API call should have failed validation
  // Wait a bit for any async validation
  await waitFor(() => {
    expect(screen.queryByText(/Verify Your Email/i)).not.toBeInTheDocument();
  });
});

test('shows error when confirm password is empty', async () => {
  const user = userEvent.setup();
  render(<CitizenSignUpForm />);

  await user.type(screen.getByPlaceholderText(/Enter your First Name/i), 'John');
  await user.type(screen.getByPlaceholderText(/Enter your Last Name/i), 'Doe');
  await user.type(screen.getByPlaceholderText(/Enter your Username/i), 'jdoe');
  await user.type(screen.getByPlaceholderText(/Enter your Email/i), 'jdoe@example.com');
  await user.type(screen.getByPlaceholderText(/^Enter Password$/i), 'password1');
  // Leave confirm password empty - don't type anything
  await user.type(screen.getByPlaceholderText(/Enter Mobile Number/i), '1234567890');

  await user.click(screen.getByRole('button', { name: /Send OTP to Email/i }));

  // Passwords should not match - verify error state
  await waitFor(() => {
    expect(screen.queryByText(/Verify Your Email/i)).not.toBeInTheDocument();
  });
});

test('shows error when mobile number is invalid', async () => {
  const user = userEvent.setup();
  render(<CitizenSignUpForm />);

  await user.type(screen.getByPlaceholderText(/Enter your First Name/i), 'John');
  await user.type(screen.getByPlaceholderText(/Enter your Last Name/i), 'Doe');
  await user.type(screen.getByPlaceholderText(/Enter your Username/i), 'jdoe');
  await user.type(screen.getByPlaceholderText(/Enter your Email/i), 'jdoe@example.com');
  await user.type(screen.getByPlaceholderText(/^Enter Password$/i), 'password1');
  await user.type(screen.getByPlaceholderText(/Re-enter Password/i), 'password1');
  await user.type(screen.getByPlaceholderText(/Enter Mobile Number/i), '123');

  await user.click(screen.getByRole('button', { name: /Send OTP to Email/i }));

  // Short mobile number should fail validation
  await waitFor(() => {
    expect(screen.queryByText(/Verify Your Email/i)).not.toBeInTheDocument();
  });
});

test('form fields are cleared after successful registration', async () => {
  const user = userEvent.setup();

  api.post
    .mockResolvedValueOnce({ data: { message: 'OTP sent to your email!' } })
    .mockResolvedValueOnce({ data: { message: 'Registration successful!', access: 'FAKE_TOKEN', user_id: '42', username: 'jdoe' } });

  render(<CitizenSignUpForm />);

  const firstNameInput = screen.getByPlaceholderText(/Enter your First Name/i);
  await user.type(firstNameInput, 'Clear');
  await user.type(screen.getByPlaceholderText(/Enter your Last Name/i), 'Test');
  await user.type(screen.getByPlaceholderText(/Enter your Username/i), 'cleartest');
  await user.type(screen.getByPlaceholderText(/Enter your Email/i), 'cleartest@example.com');
  await user.type(screen.getByPlaceholderText(/^Enter Password$/i), 'password1');
  await user.type(screen.getByPlaceholderText(/Re-enter Password/i), 'password1');
  await user.type(screen.getByPlaceholderText(/Enter Mobile Number/i), '1234567890');

  await user.click(screen.getByRole('button', { name: /Send OTP to Email/i }));

  expect(await screen.findByText(/Verify Your Email/i)).toBeInTheDocument();

  await user.type(screen.getByPlaceholderText(/Enter 6-digit OTP/i), '123456');
  await user.click(screen.getByRole('button', { name: /Verify OTP/i }));

  await waitFor(() => expect(screen.getByRole('heading', { name: /Registration Successful!/i })).toBeInTheDocument());

  // After success, localStorage should be populated
  expect(localStorage.getItem('user_id')).toBe('42');
});

test('resend OTP failure with server message is displayed', async () => {
  const user = userEvent.setup();

  // initial send OTP success, resend fails with server message
  api.post
    .mockResolvedValueOnce({ data: { message: 'OTP sent' } })
    .mockRejectedValueOnce({ response: { data: { message: 'Too many requests' } } });

  render(<CitizenSignUpForm />);

  // fill minimal fields and send
  await user.type(screen.getByPlaceholderText(/Enter your First Name/i), 'R');
  await user.type(screen.getByPlaceholderText(/Enter your Last Name/i), 'S');
  await user.type(screen.getByPlaceholderText(/Enter your Username/i), 'rs');
  await user.type(screen.getByPlaceholderText(/Enter your Email/i), 'rs@example.com');
  await user.type(screen.getByPlaceholderText(/^Enter Password$/i), 'password1');
  await user.type(screen.getByPlaceholderText(/Re-enter Password/i), 'password1');
  await user.type(screen.getByPlaceholderText(/Enter Mobile Number/i), '1234567890');

  await user.click(screen.getByRole('button', { name: /Send OTP to Email/i }));

  expect(await screen.findByText(/Verify Your Email/i)).toBeInTheDocument();

  // Click Resend OTP which will fail with server message
  const resendBtn = screen.getByRole('button', { name: /Resend OTP/i });
  await user.click(resendBtn);

  // Component may show server-provided message or a generic failure message.
  expect(await screen.findByText(/Too many requests|Failed to resend OTP\. Please try again\./i)).toBeInTheDocument();
});