import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Login from '../Login';
import api from '../../utils/axiosConfig';
import axios from 'axios';
import { vi } from 'vitest';

const navigateMock = vi.fn();

vi.mock('../../utils/axiosConfig', () => ({
  default: { post: vi.fn() },
}));

vi.mock('axios', () => ({
  default: { get: vi.fn() },
}));

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => navigateMock,
  };
});

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
});

test('renders login inputs and buttons', () => {
  render(<Login />);

  expect(screen.getByPlaceholderText(/Username or Email/i)).toBeInTheDocument();
  expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Login/i })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Test Connection/i })).toBeInTheDocument();
});

test('successful login stores token and navigates', async () => {
  const user = userEvent.setup();
  // Mock login response
  api.post.mockResolvedValueOnce({ data: { access: 'TOK', user_id: '9', username: 'alice', user_type: 'citizen' } });

  render(<Login />);

  await user.type(screen.getByPlaceholderText(/Username or Email/i), 'alice');
  await user.type(screen.getByPlaceholderText(/Password/i), 'password');

  // use fake timers to trigger setTimeout navigate
  vi.useFakeTimers();

  await user.click(screen.getByRole('button', { name: /Login/i }));

  await waitFor(() => expect(api.post).toHaveBeenCalledWith('/users/login/', { username: 'alice', password: 'password' }, expect.any(Object)));

  // advance timers to trigger navigate
  vi.runAllTimers();

  expect(localStorage.getItem('access_token')).toBe('TOK');
  expect(localStorage.getItem('user_id')).toBe('9');
  expect(localStorage.getItem('username')).toBe('alice');
  expect(localStorage.getItem('isAuthenticated')).toBe('true');
  expect(navigateMock).toHaveBeenCalledWith('/');

  vi.useRealTimers();
});

test('failed login (401) shows error and clears form', async () => {
  const user = userEvent.setup();
  const err = { response: { status: 401 } };
  api.post.mockRejectedValueOnce(err);

  render(<Login />);

  await user.type(screen.getByPlaceholderText(/Username or Email/i), 'bad');
  await user.type(screen.getByPlaceholderText(/Password/i), 'wrong');

  await user.click(screen.getByRole('button', { name: /Login/i }));

  expect(await screen.findByText(/Incorrect username or password/i)).toBeInTheDocument();
  // inputs should be cleared
  expect(screen.getByPlaceholderText(/Username or Email/i)).toHaveValue('');
  expect(screen.getByPlaceholderText(/Password/i)).toHaveValue('');
});

test('testConnection success and failure show messages', async () => {
  const user = userEvent.setup();

  // success
  axios.get.mockResolvedValueOnce({ data: { ok: true } });
  render(<Login />);
  await user.click(screen.getByRole('button', { name: /Test Connection/i }));

  expect(await screen.findByText(/Backend connection successful/i)).toBeInTheDocument();

  // failure
  axios.get.mockRejectedValueOnce(new Error('network'));
  await user.click(screen.getByRole('button', { name: /Test Connection/i }));
  expect(await screen.findByText(/Cannot connect to backend/i)).toBeInTheDocument();
});

test('forgot password request and reset flows', async () => {
  const user = userEvent.setup();

  // Mock forgot password response then reset response
  api.post
    .mockImplementationOnce(() => Promise.resolve({ data: { message: 'OTP sent' } }))
    .mockImplementationOnce(() => Promise.resolve({ data: { message: 'Password reset successful.' } }));

  render(<Login />);

  // Open forgot modal
  await user.click(screen.getByRole('button', { name: /Forgot password\?/i }));

  // Fill email and submit
  await user.type(screen.getByPlaceholderText(/Email/i), 'me@example.com');
  await user.click(screen.getByRole('button', { name: /Send OTP/i }));

  expect(await screen.findByText(/OTP sent/i)).toBeInTheDocument();

  // Now in verify stage - fill OTP and new password
  await user.type(screen.getByPlaceholderText(/OTP/i), '123456');
  await user.type(screen.getByPlaceholderText(/New password/i), 'newpass');
  await user.click(screen.getByRole('button', { name: /Reset Password/i }));

  expect(await screen.findByText(/Password reset successful/i)).toBeInTheDocument();
  // login username should be prefilled with email
  expect(screen.getByPlaceholderText(/Username or Email/i)).toHaveValue('me@example.com');
});
