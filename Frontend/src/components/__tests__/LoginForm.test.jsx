import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// Mock axios first
vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => ({
      get: vi.fn(),
      post: vi.fn(),
      delete: vi.fn(),
      defaults: {
        headers: { common: {} },
      },
      interceptors: {
        request: {
          use: vi.fn(() => 0),
          eject: vi.fn(),
        },
        response: {
          use: vi.fn(() => 0),
          eject: vi.fn(),
        },
      },
    })),
    defaults: {
      headers: { common: {} },
      withCredentials: true,
    },
    get: vi.fn(),
    post: vi.fn(),
  },
}));

// Mock modules
vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(() => vi.fn()),
}));

vi.mock('../utils/axiosConfig', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: {
        use: vi.fn(),
        eject: vi.fn(),
      },
      response: {
        use: vi.fn(),
        eject: vi.fn(),
      },
    },
  },
}));

vi.mock('lucide-react', () => ({
  Eye: () => <span data-testid="eye-icon">Eye</span>,
  EyeOff: () => <span data-testid="eye-off-icon">EyeOff</span>,
  Shield: () => <span data-testid="shield-icon">Shield</span>,
  CheckCircle: () => <span data-testid="check-circle-icon">Check</span>,
  AlertCircle: () => <span data-testid="alert-circle-icon">Alert</span>,
}));

vi.mock('../components/CitizenSignUpForm', () => ({
  default: () => <div data-testid="citizen-signup">Citizen SignUp</div>,
}));

vi.mock('../components/GovtAuthSignUpForm', () => ({
  default: () => <div data-testid="govt-signup">Govt SignUp</div>,
}));

vi.mock('../components/FieldWorkerSignUpForm', () => ({
  default: () => <div data-testid="fieldworker-signup">FieldWorker SignUp</div>,
}));

vi.mock('../components/AdminSignUpForm', () => ({
  default: () => <div data-testid="admin-signup">Admin SignUp</div>,
}));

import Login from '../LoginForm';
import api from '../../utils/axiosConfig';
import axios from 'axios';

// Get the mocked function instances
const mockApiGet = vi.mocked(api).get;
const mockApiPost = vi.mocked(api).post;
const mockApiDelete = vi.mocked(api).delete;
const mockAxiosGet = vi.mocked(axios).get;
const mockAxiosPost = vi.mocked(axios).post;

// Helper to get form submit button (the one with type="submit")
const getLoginSubmitBtn = () => {
  const buttons = screen.getAllByRole('button');
  return buttons.find(btn => btn.getAttribute('type') === 'submit' && (btn.textContent.includes('Login') || btn.textContent.includes('Logging')));
};

describe('LoginForm - Full Coverage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
    mockApiGet.mockReset();
    mockApiPost.mockReset();
    mockAxiosGet.mockReset();
    mockAxiosPost.mockReset();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  // ===== LOGIN FORM RENDERING TESTS =====

  it('renders login form with all fields', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });

    render(<Login />);

    expect(screen.getByPlaceholderText('Username or Email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Forgot password/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Test Connection/i })).toBeInTheDocument();
  });

  it('renders page title and branding', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });

    render(<Login />);

    // Check for title text - there are multiple instances but we just need to find one
    const titleElements = screen.getAllByText('Smart Complaints');
    expect(titleElements.length).toBeGreaterThan(0);
    expect(screen.getByPlaceholderText('Username or Email')).toBeInTheDocument();
  });

  it('renders login and signup tabs', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });

    render(<Login />);

    const buttons = screen.getAllByRole('button');
    const loginTab = buttons.find(btn => btn.textContent === 'Login' && btn.getAttribute('type') !== 'submit');
    const signupTab = buttons.find(btn => btn.textContent === 'SignUp');
    
    expect(loginTab).toBeInTheDocument();
    expect(signupTab).toBeInTheDocument();
  });

  // ===== PASSWORD VISIBILITY TOGGLE =====

  it('toggles password visibility', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });

    render(<Login />);

    const passwordInput = screen.getByPlaceholderText('Password');
    expect(passwordInput).toHaveAttribute('type', 'password');

    await waitFor(() => {
      expect(screen.getByTestId('eye-icon')).toBeInTheDocument();
    });
  });

  // ===== LOGIN SUBMISSION TESTS =====

  it('successful login stores token and navigates', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });
    mockApiPost.mockResolvedValueOnce({
      data: {
        access: 'test-token-123',
        user_id: 1,
        username: 'testuser',
        user_type: 'Citizen',
      },
    });

    vi.useFakeTimers();

    render(<Login />);

    const usernameInput = screen.getByPlaceholderText('Username or Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const loginBtn = getLoginSubmitBtn();

    await userEvent.type(usernameInput, 'testuser');
    await userEvent.type(passwordInput, 'password123');
    await userEvent.click(loginBtn);

    await waitFor(() => {
      expect(localStorage.getItem('access_token')).toBe('test-token-123');
    });

    vi.runAllTimers();
    vi.useRealTimers();
  });

  it('handles 401 login error', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });
    mockApiPost.mockRejectedValueOnce({
      response: { status: 401, data: {} },
    });

    render(<Login />);

    const usernameInput = screen.getByPlaceholderText('Username or Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const loginBtn = getLoginSubmitBtn();

    await userEvent.type(usernameInput, 'wrong');
    await userEvent.type(passwordInput, 'wrong');
    await userEvent.click(loginBtn);

    await waitFor(() =>
      expect(screen.getByText(/Incorrect username or password/i)).toBeInTheDocument()
    );
  });

  it('handles 403 forbidden error', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });
    mockApiPost.mockRejectedValueOnce({
      response: { status: 403, data: {} },
    });

    render(<Login />);

    const usernameInput = screen.getByPlaceholderText('Username or Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const loginBtn = getLoginSubmitBtn();

    await userEvent.type(usernameInput, 'unverified');
    await userEvent.type(passwordInput, 'pass');
    await userEvent.click(loginBtn);

    await waitFor(() =>
      expect(screen.getByText(/Account pending admin verification/i)).toBeInTheDocument()
    );
  });

  it('handles server error response', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });
    mockApiPost.mockRejectedValueOnce({
      response: { status: 500, data: { error: 'Internal server error' } },
    });

    render(<Login />);

    const usernameInput = screen.getByPlaceholderText('Username or Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const loginBtn = getLoginSubmitBtn();

    await userEvent.type(usernameInput, 'test');
    await userEvent.type(passwordInput, 'test');
    await userEvent.click(loginBtn);

    await waitFor(() =>
      expect(screen.getByText(/Internal server error/i)).toBeInTheDocument()
    );
  });

  it('handles network error', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });
    mockApiPost.mockRejectedValueOnce({
      request: {},
      response: null,
    });

    render(<Login />);

    const usernameInput = screen.getByPlaceholderText('Username or Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const loginBtn = getLoginSubmitBtn();

    await userEvent.type(usernameInput, 'test');
    await userEvent.type(passwordInput, 'test');
    await userEvent.click(loginBtn);

    await waitFor(() =>
      expect(screen.getByText(/Cannot connect to server/i)).toBeInTheDocument()
    );
  });

  it('handles unknown error', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });
    mockApiPost.mockRejectedValueOnce(new Error('Unknown error'));

    render(<Login />);

    const usernameInput = screen.getByPlaceholderText('Username or Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const loginBtn = getLoginSubmitBtn();

    await userEvent.type(usernameInput, 'test');
    await userEvent.type(passwordInput, 'test');
    await userEvent.click(loginBtn);

    await waitFor(() =>
      expect(screen.getByText(/Login failed/i)).toBeInTheDocument()
    );
  });

  // ===== ERROR DISMISSAL =====

  it('dismisses error message', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });
    mockApiPost.mockRejectedValueOnce({
      response: { status: 401 },
    });

    render(<Login />);

    const usernameInput = screen.getByPlaceholderText('Username or Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const loginBtn = getLoginSubmitBtn();

    await userEvent.type(usernameInput, 'test');
    await userEvent.type(passwordInput, 'test');
    await userEvent.click(loginBtn);

    await waitFor(() => expect(screen.getByText(/Incorrect username or password/i)).toBeInTheDocument());

    const dismissBtn = screen.getByRole('button', { name: /✕/ });
    await userEvent.click(dismissBtn);

    await waitFor(() =>
      expect(screen.queryByText(/Incorrect username or password/i)).not.toBeInTheDocument()
    );
  });

  // ===== TEST CONNECTION =====

  it('test connection success', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });
    mockAxiosGet.mockResolvedValueOnce({ data: { departments: [] } });

    render(<Login />);

    const testBtn = screen.getByRole('button', { name: /Test Connection/i });
    await userEvent.click(testBtn);

    await waitFor(() =>
      expect(screen.getByText(/Backend connection successful/i)).toBeInTheDocument()
    );
  });

  it('test connection server error', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });
    mockAxiosGet.mockRejectedValueOnce({
      response: { status: 500, data: { detail: 'Server error' } },
    });

    render(<Login />);

    const testBtn = screen.getByRole('button', { name: /Test Connection/i });
    await userEvent.click(testBtn);

    await waitFor(() =>
      expect(screen.getByText(/Backend responded with 500/i)).toBeInTheDocument()
    );
  });

  it('test connection network error', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });
    mockAxiosGet.mockRejectedValueOnce({
      response: null,
      request: {},
    });

    render(<Login />);

    const testBtn = screen.getByRole('button', { name: /Test Connection/i });
    await userEvent.click(testBtn);

    await waitFor(() =>
      expect(screen.getByText(/Cannot connect to backend/i)).toBeInTheDocument()
    );
  });

  // ===== SIGNUP TAB TESTS =====

  it('switches to signup form', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });

    render(<Login />);

    const signupTab = screen.getByRole('button', { name: 'SignUp' });
    await userEvent.click(signupTab);

    expect(screen.getByText('Create Account')).toBeInTheDocument();
  });

  it('renders citizen signup by default', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });

    render(<Login />);

    const signupTab = screen.getByRole('button', { name: 'SignUp' });
    await userEvent.click(signupTab);

    expect(screen.getByTestId('citizen-signup')).toBeInTheDocument();
  });

  it('switches between signup forms', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });

    render(<Login />);

    const signupTab = screen.getByRole('button', { name: 'SignUp' });
    await userEvent.click(signupTab);

    const govtTab = screen.getByRole('button', { name: 'Government Authority' });
    await userEvent.click(govtTab);

    expect(screen.getByTestId('govt-signup')).toBeInTheDocument();

    const fieldworkerTab = screen.getByRole('button', { name: 'Field Worker' });
    await userEvent.click(fieldworkerTab);

    expect(screen.getByTestId('fieldworker-signup')).toBeInTheDocument();

    const adminTab = screen.getByRole('button', { name: 'Admin' });
    await userEvent.click(adminTab);

    expect(screen.getByTestId('admin-signup')).toBeInTheDocument();
  });

  // ===== FORGOT PASSWORD TESTS =====

  it('opens forgot password modal', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });

    render(<Login />);

    const forgotBtn = screen.getByRole('button', { name: /Forgot password/i });
    await userEvent.click(forgotBtn);

    expect(screen.getByText('Reset Password')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument();
  });

  it('sends forgot password request', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });
    mockApiPost.mockResolvedValueOnce({
      data: { message: 'OTP sent to email.' },
    });

    render(<Login />);

    const forgotBtn = screen.getByRole('button', { name: /Forgot password/i });
    await userEvent.click(forgotBtn);

    const emailInput = screen.getByPlaceholderText('Email');
    const sendBtns = screen.getAllByRole('button');
    const sendBtn = sendBtns.find(btn => btn.textContent.includes('Send') || btn.textContent.includes('OTP'));

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(sendBtn);

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith(
        '/users/forgot-password/',
        { email: 'test@example.com' },
        expect.any(Object)
      )
    );
  });

  it('handles forgot password error (no email)', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });

    render(<Login />);

    const forgotBtn = screen.getByRole('button', { name: /Forgot password/i });
    await userEvent.click(forgotBtn);

    const sendBtns = screen.getAllByRole('button');
    const sendBtn = sendBtns.find(btn => btn.textContent.includes('Send') || btn.textContent.includes('OTP'));
    await userEvent.click(sendBtn);

    await waitFor(() =>
      expect(screen.getByText(/Please enter your email/i)).toBeInTheDocument()
    );
  });

  it('handles forgot password server error', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });
    mockApiPost.mockRejectedValueOnce({
      response: { status: 400, data: { error: 'Email not found' } },
    });

    render(<Login />);

    const forgotBtn = screen.getByRole('button', { name: /Forgot password/i });
    await userEvent.click(forgotBtn);

    const emailInput = screen.getByPlaceholderText('Email');
    const sendBtns = screen.getAllByRole('button');
    const sendBtn = sendBtns.find(btn => btn.textContent.includes('Send') || btn.textContent.includes('OTP'));

    await userEvent.type(emailInput, 'nonexistent@example.com');
    await userEvent.click(sendBtn);

    await waitFor(() =>
      expect(screen.getByText(/Email not found/i)).toBeInTheDocument()
    );
  });

  it('handles forgot password network error', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });
    mockApiPost.mockRejectedValueOnce({
      request: {},
      response: null,
    });

    render(<Login />);

    const forgotBtn = screen.getByRole('button', { name: /Forgot password/i });
    await userEvent.click(forgotBtn);

    const emailInput = screen.getByPlaceholderText('Email');
    const sendBtns = screen.getAllByRole('button');
    const sendBtn = sendBtns.find(btn => btn.textContent.includes('Send') || btn.textContent.includes('OTP'));

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(sendBtn);

    await waitFor(() =>
      expect(screen.getByText(/Cannot connect to server/i)).toBeInTheDocument()
    );
  });

  it('resets password after OTP verification', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });
    mockApiPost
      .mockResolvedValueOnce({
        data: { message: 'OTP sent to email.' },
      })
      .mockResolvedValueOnce({
        data: { message: 'Password reset successful.' },
      });

    vi.useFakeTimers();

    render(<Login />);

    const forgotBtn = screen.getByRole('button', { name: /Forgot password/i });
    await userEvent.click(forgotBtn);

    const emailInput = screen.getByPlaceholderText('Email');
    const sendBtns = screen.getAllByRole('button');
    const sendBtn = sendBtns.find(btn => btn.textContent.includes('Send') || btn.textContent.includes('OTP'));

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(sendBtn);

    await waitFor(() =>
      expect(screen.getByPlaceholderText('OTP')).toBeInTheDocument()
    );

    const otpInput = screen.getByPlaceholderText('OTP');
    const passwordInput = screen.getByPlaceholderText('New password');
    const resetBtns = screen.getAllByRole('button');
    const resetBtn = resetBtns.find(btn => btn.textContent.includes('Reset'));

    await userEvent.type(otpInput, '123456');
    await userEvent.type(passwordInput, 'newpassword123');
    await userEvent.click(resetBtn);

    await waitFor(() =>
      expect(mockApiPost).toHaveBeenCalledWith(
        '/users/reset-password/',
        {
          email: 'test@example.com',
          otp: '123456',
          new_password: 'newpassword123',
        },
        expect.any(Object)
      )
    );

    vi.runAllTimers();
    vi.useRealTimers();
  });

  it('handles reset password error (missing fields)', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });
    mockApiPost.mockResolvedValueOnce({
      data: { message: 'OTP sent to email.' },
    });

    render(<Login />);

    const forgotBtn = screen.getByRole('button', { name: /Forgot password/i });
    await userEvent.click(forgotBtn);

    const emailInput = screen.getByPlaceholderText('Email');
    const sendBtns = screen.getAllByRole('button');
    const sendBtn = sendBtns.find(btn => btn.textContent.includes('Send') || btn.textContent.includes('OTP'));

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(sendBtn);

    await waitFor(() =>
      expect(screen.getByPlaceholderText('OTP')).toBeInTheDocument()
    );

    const resetBtns = screen.getAllByRole('button');
    const resetBtn = resetBtns.find(btn => btn.textContent.includes('Reset'));
    await userEvent.click(resetBtn);

    await waitFor(() =>
      expect(screen.getByText(/Email, OTP and new password are required/i)).toBeInTheDocument()
    );
  });

  it('closes forgot modal on cancel', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });

    render(<Login />);

    const forgotBtn = screen.getByRole('button', { name: /Forgot password/i });
    await userEvent.click(forgotBtn);

    expect(screen.getByText('Reset Password')).toBeInTheDocument();

    const cancelBtns = screen.getAllByRole('button');
    const cancelBtn = cancelBtns.find(btn => btn.textContent === 'Cancel');
    await userEvent.click(cancelBtn);

    await waitFor(() =>
      expect(screen.queryByText('Reset Password')).not.toBeInTheDocument()
    );
  });

  // ===== FORM INTERACTIONS =====

  it('updates input values on change', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });

    render(<Login />);

    const usernameInput = screen.getByPlaceholderText('Username or Email');
    const passwordInput = screen.getByPlaceholderText('Password');

    await userEvent.type(usernameInput, 'testuser');
    expect(usernameInput).toHaveValue('testuser');

    await userEvent.type(passwordInput, 'testpass');
    expect(passwordInput).toHaveValue('testpass');
  });

  it('disables inputs during loading', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });
    mockApiPost.mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: { access: 'token', user_id: 1, username: 'user', user_type: 'Citizen' },
              }),
            100
          )
        )
    );

    render(<Login />);

    const usernameInput = screen.getByPlaceholderText('Username or Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const loginBtn = getLoginSubmitBtn();

    await userEvent.type(usernameInput, 'test');
    await userEvent.type(passwordInput, 'test');
    await userEvent.click(loginBtn);

    expect(usernameInput).toBeDisabled();
    expect(passwordInput).toBeDisabled();
    expect(loginBtn).toBeDisabled();
  });

  it('shows loading text on submit button', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });
    mockApiPost.mockImplementationOnce(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                data: { access: 'token', user_id: 1, username: 'user', user_type: 'Citizen' },
              }),
            100
          )
        )
    );

    render(<Login />);

    const usernameInput = screen.getByPlaceholderText('Username or Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const loginBtn = getLoginSubmitBtn();

    await userEvent.type(usernameInput, 'test');
    await userEvent.type(passwordInput, 'test');
    await userEvent.click(loginBtn);

    await waitFor(() => expect(screen.getByText('Logging in...')).toBeInTheDocument());
  });

  it('shows message on successful login', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });
    mockApiPost.mockResolvedValueOnce({
      data: { access: 'token', user_id: 1, username: 'user', user_type: 'Citizen' },
    });

    render(<Login />);

    const usernameInput = screen.getByPlaceholderText('Username or Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const loginBtn = getLoginSubmitBtn();

    await userEvent.type(usernameInput, 'test');
    await userEvent.type(passwordInput, 'test');
    await userEvent.click(loginBtn);

    await waitFor(() =>
      expect(screen.getByText(/Login successful/i)).toBeInTheDocument()
    );
  });

  // ===== SIGN UP LINK =====

  it('displays sign up link in login form', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });

    render(<Login />);

    expect(screen.getByText(/Don't have an account/i)).toBeInTheDocument();
  });

  it('navigates to signup when clicking sign up link', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });

    render(<Login />);

    const signupLink = screen.getByRole('button', { name: /Sign up/i });
    await userEvent.click(signupLink);

    expect(screen.getByText('Create Account')).toBeInTheDocument();
  });

  // ===== INITIALIZATION =====

  it('initializes with default active tab as Citizen', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });

    render(<Login activeTab="Citizen" />);

    const signupBtn = screen.getByRole('button', { name: 'SignUp' });
    await userEvent.click(signupBtn);

    expect(screen.getByTestId('citizen-signup')).toBeInTheDocument();
  });

  it('initializes with Government Authority tab if provided', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });

    render(<Login activeTab="Government Authority" />);

    const signupBtn = screen.getByRole('button', { name: 'SignUp' });
    await userEvent.click(signupBtn);

    expect(screen.getByTestId('govt-signup')).toBeInTheDocument();
  });

  // ===== EDGE CASES =====

  it('clears password after failed login', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });
    mockApiPost.mockRejectedValueOnce({
      response: { status: 401 },
    });

    render(<Login />);

    const usernameInput = screen.getByPlaceholderText('Username or Email');
    const passwordInput = screen.getByPlaceholderText('Password');
    const loginBtn = getLoginSubmitBtn();

    await userEvent.type(usernameInput, 'test');
    await userEvent.type(passwordInput, 'test');
    await userEvent.click(loginBtn);

    await waitFor(() => {
      expect(usernameInput).toHaveValue('');
      expect(passwordInput).toHaveValue('');
    });
  });

  it('prefills username after successful password reset', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });
    mockApiPost
      .mockResolvedValueOnce({
        data: { message: 'OTP sent' },
      })
      .mockResolvedValueOnce({
        data: { message: 'Password reset successful.' },
      });

    vi.useFakeTimers();

    render(<Login />);

    const forgotBtn = screen.getByRole('button', { name: /Forgot password/i });
    await userEvent.click(forgotBtn);

    const emailInput = screen.getByPlaceholderText('Email');
    const sendBtns = screen.getAllByRole('button');
    const sendBtn = sendBtns.find(btn => btn.textContent.includes('Send') || btn.textContent.includes('OTP'));

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(sendBtn);

    await waitFor(() =>
      expect(screen.getByPlaceholderText('OTP')).toBeInTheDocument()
    );

    const otpInput = screen.getByPlaceholderText('OTP');
    const passwordInput = screen.getByPlaceholderText('New password');
    const resetBtns = screen.getAllByRole('button');
    const resetBtn = resetBtns.find(btn => btn.textContent.includes('Reset'));

    await userEvent.type(otpInput, '123456');
    await userEvent.type(passwordInput, 'newpass');
    await userEvent.click(resetBtn);

    await waitFor(() => {
      expect(screen.getByText(/Password reset successful/i)).toBeInTheDocument();
    });

    vi.runAllTimers();
    vi.useRealTimers();

    const usernameInput = screen.getByPlaceholderText('Username or Email');
    expect(usernameInput).toHaveValue('test@example.com');
  });

  it('handles forgot password with missing detail field in error', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });
    mockApiPost.mockRejectedValueOnce({
      response: { status: 400, data: { message: 'Email validation failed' } },
    });

    render(<Login />);

    const forgotBtn = screen.getByRole('button', { name: /Forgot password/i });
    await userEvent.click(forgotBtn);

    const emailInput = screen.getByPlaceholderText('Email');
    const sendBtns = screen.getAllByRole('button');
    const sendBtn = sendBtns.find(btn => btn.textContent.includes('Send') || btn.textContent.includes('OTP'));

    await userEvent.type(emailInput, 'invalid');
    await userEvent.click(sendBtn);

    await waitFor(() =>
      expect(screen.getByText(/Email validation failed/i)).toBeInTheDocument()
    );
  });

  it('handles forgot password with status code only error', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });
    mockApiPost.mockRejectedValueOnce({
      response: { status: 500, data: {} },
    });

    render(<Login />);

    const forgotBtn = screen.getByRole('button', { name: /Forgot password/i });
    await userEvent.click(forgotBtn);

    const emailInput = screen.getByPlaceholderText('Email');
    const sendBtns = screen.getAllByRole('button');
    const sendBtn = sendBtns.find(btn => btn.textContent.includes('Send') || btn.textContent.includes('OTP'));

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(sendBtn);

    await waitFor(() =>
      expect(screen.getByText(/Server 500/i)).toBeInTheDocument()
    );
  });

  it('handles reset password with unknown error', async () => {
    mockApiGet.mockResolvedValueOnce({ data: [] });
    mockApiPost
      .mockResolvedValueOnce({
        data: { message: 'OTP sent' },
      })
      .mockRejectedValueOnce(new Error('Unknown error'));

    render(<Login />);

    const forgotBtn = screen.getByRole('button', { name: /Forgot password/i });
    await userEvent.click(forgotBtn);

    const emailInput = screen.getByPlaceholderText('Email');
    const sendBtns = screen.getAllByRole('button');
    const sendBtn = sendBtns.find(btn => btn.textContent.includes('Send') || btn.textContent.includes('OTP'));

    await userEvent.type(emailInput, 'test@example.com');
    await userEvent.click(sendBtn);

    await waitFor(() =>
      expect(screen.getByPlaceholderText('OTP')).toBeInTheDocument()
    );

    const otpInput = screen.getByPlaceholderText('OTP');
    const passwordInput = screen.getByPlaceholderText('New password');
    const resetBtns = screen.getAllByRole('button');
    const resetBtn = resetBtns.find(btn => btn.textContent.includes('Reset'));

    await userEvent.type(otpInput, '123456');
    await userEvent.type(passwordInput, 'newpass');
    await userEvent.click(resetBtn);

    await waitFor(() =>
      expect(screen.getByText(/Request failed: Unknown error/i)).toBeInTheDocument()
    );
  });
});
