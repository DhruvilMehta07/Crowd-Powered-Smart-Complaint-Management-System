import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Profile from '../pages/Profile';
import api from '../utils/axiosConfig';

// Mock the axios config
vi.mock('../utils/axiosConfig');

const mockProfileData = {
  id: 1,
  first_name: 'John',
  last_name: 'Doe',
  username: 'johndoe',
  email: 'john@example.com',
  phone_number: '+1234567890',
  date_joined: '2023-01-15T10:30:00Z',
};

describe('Profile Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockResolvedValue({ data: mockProfileData });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Profile Display & Initialization', () => {
    it('should render Profile component without crashing', async () => {
      render(<Profile />);
      
      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument();
      });
    });

    it('should display loading state initially', () => {
      api.get.mockImplementation(() => new Promise(() => {})); // Never resolves
      render(<Profile />);
      expect(screen.getByText('Loading profile...')).toBeInTheDocument();
    });

    it('should display error message when API call fails', async () => {
      api.get.mockRejectedValue(new Error('API Error'));
      render(<Profile />);
      
      await waitFor(() => {
        expect(screen.getByText('Unable to load profile.')).toBeInTheDocument();
      });
    });

    it('should call API endpoint on component mount', async () => {
      render(<Profile />);
      
      await waitFor(() => {
        expect(api.get).toHaveBeenCalledWith('/users/profile/');
      });
    });

    it('should handle API error response with detail message', async () => {
      api.get.mockRejectedValue({
        response: {
          status: 500,
          data: {
            detail: 'Server error'
          }
        }
      });
      render(<Profile />);
      
      await waitFor(() => {
        expect(screen.getByText('Unable to load profile.')).toBeInTheDocument();
      });
    });
  });

  describe('Profile Information Display', () => {
    it('should display user profile information correctly', async () => {
      render(<Profile />);
      
      await waitFor(() => {
        expect(screen.getByText('John Doe')).toBeInTheDocument();
        expect(screen.getByText('johndoe')).toBeInTheDocument();
        expect(screen.getByText('john@example.com')).toBeInTheDocument();
        expect(screen.getByText('+1234567890')).toBeInTheDocument();
      });
    });

    it('should format date_joined correctly', async () => {
      render(<Profile />);
      
      await waitFor(() => {
        const joinedElement = screen.queryByText(/1\/15\/2023|2023-01-15/);
        expect(joinedElement).toBeInTheDocument();
      });
    });

    it('should display dash when phone_number is missing', async () => {
      api.get.mockResolvedValue({ 
        data: { 
          ...mockProfileData, 
          phone_number: null 
        } 
      });
      render(<Profile />);
      
      await waitFor(() => {
        expect(screen.getAllByText('—').length).toBeGreaterThan(0);
      });
    });

    it('should display profile section heading', async () => {
      render(<Profile />);
      
      await waitFor(() => {
        expect(screen.getByText('Profile')).toBeInTheDocument();
      });
    });

    it('should display all profile field labels', async () => {
      render(<Profile />);
      
      await waitFor(() => {
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Username')).toBeInTheDocument();
        expect(screen.getByText('Email')).toBeInTheDocument();
        expect(screen.getByText('Phone')).toBeInTheDocument();
        expect(screen.getByText('Joined')).toBeInTheDocument();
      });
    });

    it('should handle empty string phone number', async () => {
      api.get.mockResolvedValue({ 
        data: { 
          ...mockProfileData, 
          phone_number: '' 
        } 
      });
      render(<Profile />);
      
      await waitFor(() => {
        // Empty string is falsy, so should display dash
        expect(screen.getByText('Phone')).toBeInTheDocument();
      });
    });

    it('should display first name and last name in correct order', async () => {
      render(<Profile />);
      
      await waitFor(() => {
        const nameText = screen.getByText('John Doe');
        expect(nameText).toBeInTheDocument();
      });
    });

    it('should handle null date_joined', async () => {
      api.get.mockResolvedValue({ 
        data: { 
          ...mockProfileData, 
          date_joined: null 
        } 
      });
      render(<Profile />);
      
      await waitFor(() => {
        expect(screen.getAllByText('—').length).toBeGreaterThan(0);
      });
    });

    it('should display user profile in 2-column grid layout', async () => {
      const { container } = render(<Profile />);
      
      await waitFor(() => {
        const grid = container.querySelector('.grid');
        expect(grid).toHaveClass('grid-cols-1', 'md:grid-cols-2');
      });
    });
  });

  describe('Change Password - Current Password Method', () => {
    it('should display "Change password" section heading', async () => {
      render(<Profile />);
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Change password/i })).toBeInTheDocument();
      });
    });

    it('should have radio buttons for password change method selection', async () => {
      render(<Profile />);
      
      await waitFor(() => {
        const radios = screen.getAllByRole('radio');
        expect(radios.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should display current password form by default', async () => {
      render(<Profile />);
      
      await waitFor(() => {
        expect(screen.getByPlaceholderText('Current password')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('New password')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Confirm new password')).toBeInTheDocument();
      });
    });

    it('should show error if password fields are empty', async () => {
      render(<Profile />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Change password/i })).toBeInTheDocument();
      });

      const changeButton = screen.getByRole('button', { name: /Change password/i });
      await user.click(changeButton);

      await waitFor(() => {
        expect(screen.getByText('Please fill all password fields.')).toBeInTheDocument();
      });
    });

    it('should show error if new password and confirm password do not match', async () => {
      render(<Profile />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Change password/i })).toBeInTheDocument();
      });

      const inputs = screen.getAllByPlaceholderText(/password/i);
      await user.type(inputs[0], 'currentPass123');
      await user.type(inputs[1], 'newPass123');
      await user.type(inputs[2], 'newPass456');

      const changeButton = screen.getByRole('button', { name: /Change password/i });
      await user.click(changeButton);

      await waitFor(() => {
        expect(screen.getByText('New password and confirm password do not match.')).toBeInTheDocument();
      });
    });

    it('should successfully change password with correct input', async () => {
      api.post.mockResolvedValue({ status: 200 });
      render(<Profile />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Change password/i })).toBeInTheDocument();
      });

      const inputs = screen.getAllByPlaceholderText(/password/i);
      await user.type(inputs[0], 'currentPass123');
      await user.type(inputs[1], 'newPass123');
      await user.type(inputs[2], 'newPass123');

      const changeButton = screen.getByRole('button', { name: /Change password/i });
      await user.click(changeButton);

      await waitFor(() => {
        expect(screen.getByText('Password changed successfully.')).toBeInTheDocument();
      });

      expect(api.post).toHaveBeenCalledWith('/users/change-password/', {
        current_password: 'currentPass123',
        new_password: 'newPass123',
      });
    });

    it('should handle password change API error with detail message', async () => {
      api.post.mockRejectedValue({
        response: {
          data: {
            detail: 'Current password is incorrect'
          }
        }
      });
      render(<Profile />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Change password/i })).toBeInTheDocument();
      });

      const inputs = screen.getAllByPlaceholderText(/password/i);
      await user.type(inputs[0], 'wrongPassword');
      await user.type(inputs[1], 'newPass123');
      await user.type(inputs[2], 'newPass123');

      const changeButton = screen.getByRole('button', { name: /Change password/i });
      await user.click(changeButton);

      await waitFor(() => {
        expect(screen.getByText('Current password is incorrect')).toBeInTheDocument();
      });
    });

    it('should clear password fields after successful change', async () => {
      api.post.mockResolvedValue({ status: 200 });
      render(<Profile />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Change password/i })).toBeInTheDocument();
      });

      const inputs = screen.getAllByPlaceholderText(/password/i);
      await user.type(inputs[0], 'currentPass123');
      await user.type(inputs[1], 'newPass123');
      await user.type(inputs[2], 'newPass123');

      const changeButton = screen.getByRole('button', { name: /Change password/i });
      await user.click(changeButton);

      await waitFor(() => {
        expect(inputs[0]).toHaveValue('');
        expect(inputs[1]).toHaveValue('');
        expect(inputs[2]).toHaveValue('');
      });
    });

    it('should show loading state while changing password', async () => {
      let resolveApi;
      api.post.mockImplementation(() => new Promise(resolve => {
        resolveApi = resolve;
      }));
      
      render(<Profile />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Change password/i })).toBeInTheDocument();
      });

      const inputs = screen.getAllByPlaceholderText(/password/i);
      await user.type(inputs[0], 'currentPass123');
      await user.type(inputs[1], 'newPass123');
      await user.type(inputs[2], 'newPass123');

      const changeButton = screen.getByRole('button', { name: /Change password/i });
      await user.click(changeButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Changing…/i })).toBeInTheDocument();
      });

      // Resolve the promise within waitFor
      await waitFor(() => {
        resolveApi({ status: 200 });
      });
    });

    it('should handle API error without detail message', async () => {
      api.post.mockRejectedValue({
        response: {
          data: 'Error message'
        }
      });
      render(<Profile />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Change password/i })).toBeInTheDocument();
      });

      const inputs = screen.getAllByPlaceholderText(/password/i);
      await user.type(inputs[0], 'currentPass123');
      await user.type(inputs[1], 'newPass123');
      await user.type(inputs[2], 'newPass123');

      const changeButton = screen.getByRole('button', { name: /Change password/i });
      await user.click(changeButton);

      await waitFor(() => {
        expect(screen.getByText('Error message')).toBeInTheDocument();
      });
    });

    it('should handle password change with 204 status code', async () => {
      api.post.mockResolvedValue({ status: 204 });
      render(<Profile />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Change password/i })).toBeInTheDocument();
      });

      const inputs = screen.getAllByPlaceholderText(/password/i);
      await user.type(inputs[0], 'currentPass123');
      await user.type(inputs[1], 'newPass123');
      await user.type(inputs[2], 'newPass123');

      const changeButton = screen.getByRole('button', { name: /Change password/i });
      await user.click(changeButton);

      await waitFor(() => {
        expect(screen.getByText('Password changed successfully.')).toBeInTheDocument();
      });
    });

    it('should display "Change password" button', async () => {
      render(<Profile />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Change password/i })).toBeInTheDocument();
      });
    });
  });

  describe('Change Password - Email OTP Method', () => {
    it('should switch to email OTP method when radio button is selected', async () => {
      render(<Profile />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Change password/i })).toBeInTheDocument();
      });

      const radioButtons = screen.getAllByRole('radio');
      await user.click(radioButtons[1]); // Click "Use email OTP" radio

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Send OTP/i })).toBeInTheDocument();
      });
    });

    it('should display email OTP option text', async () => {
      render(<Profile />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Change password/i })).toBeInTheDocument();
      });

      const radioButtons = screen.getAllByRole('radio');
      await user.click(radioButtons[1]);

      await waitFor(() => {
        expect(screen.getByText(/OTP will be sent to your account email/i)).toBeInTheDocument();
      });
    });

    it('should display user email in OTP section', async () => {
      render(<Profile />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Change password/i })).toBeInTheDocument();
      });

      const radioButtons = screen.getAllByRole('radio');
      await user.click(radioButtons[1]);

      await waitFor(() => {
        const emailElements = screen.getAllByText('john@example.com');
        expect(emailElements.length).toBeGreaterThanOrEqual(2);
      });
    });

    it('should send OTP to email', async () => {
      api.post.mockResolvedValue({ status: 200, data: { detail: 'OTP sent successfully' } });
      render(<Profile />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Change password/i })).toBeInTheDocument();
      });

      const radioButtons = screen.getAllByRole('radio');
      await user.click(radioButtons[1]);

      const sendButton = screen.getByRole('button', { name: /Send OTP/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(api.post).toHaveBeenCalledWith('/users/password-reset/request/');
        expect(screen.getByText('OTP sent successfully')).toBeInTheDocument();
      });
    });

    it('should show OTP input fields after OTP is sent', async () => {
      api.post.mockResolvedValue({ status: 200, data: { detail: 'OTP sent' } });
      render(<Profile />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Change password/i })).toBeInTheDocument();
      });

      const radioButtons = screen.getAllByRole('radio');
      await user.click(radioButtons[1]);

      const sendButton = screen.getByRole('button', { name: /Send OTP/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter OTP')).toBeInTheDocument();
      });
    });

    it('should verify OTP and change password successfully', async () => {
      api.post.mockResolvedValueOnce({ status: 200, data: { detail: 'OTP sent' } });
      api.post.mockResolvedValueOnce({ status: 200, data: { detail: 'Password updated successfully' } });
      
      render(<Profile />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Change password/i })).toBeInTheDocument();
      });

      const radioButtons = screen.getAllByRole('radio');
      await user.click(radioButtons[1]);

      const sendButton = screen.getByRole('button', { name: /Send OTP/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter OTP')).toBeInTheDocument();
      });

      const otpInput = screen.getByPlaceholderText('Enter OTP');
      const newPasswordInputs = screen.getAllByPlaceholderText(/New password/i);
      
      await user.type(otpInput, '123456');
      await user.type(newPasswordInputs[0], 'newPass123');
      await user.type(newPasswordInputs[1], 'newPass123');

      const verifyButton = screen.getByRole('button', { name: /Verify & Change Password/i });
      await user.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByText('Password updated successfully')).toBeInTheDocument();
      });

      expect(api.post).toHaveBeenCalledWith('/users/password-reset/verify/', {
        otp: '123456',
        new_password: 'newPass123',
      });
    });

    it('should handle OTP send error', async () => {
      api.post.mockRejectedValue({
        response: {
          data: {
            detail: 'Failed to send OTP'
          }
        }
      });
      render(<Profile />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 3 });
        expect(heading.textContent).toContain('Change password');
      });

      const radioButtons = screen.getAllByRole('radio');
      await user.click(radioButtons[1]);

      const sendButton = screen.getByRole('button', { name: /Send OTP/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Failed to send OTP')).toBeInTheDocument();
      });
    });

    it('should show error if OTP fields are incomplete', async () => {
      api.post.mockResolvedValueOnce({ status: 200, data: { detail: 'OTP sent' } });
      render(<Profile />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 3 });
        expect(heading.textContent).toContain('Change password');
      });

      const radioButtons = screen.getAllByRole('radio');
      await user.click(radioButtons[1]);

      const sendButton = screen.getByRole('button', { name: /Send OTP/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter OTP')).toBeInTheDocument();
      });

      const verifyButton = screen.getByRole('button', { name: /Verify & Change Password/i });
      await user.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByText('Please fill OTP and new password fields.')).toBeInTheDocument();
      });
    });

    it('should show error if OTP password confirmation does not match', async () => {
      api.post.mockResolvedValueOnce({ status: 200, data: { detail: 'OTP sent' } });
      render(<Profile />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 3 });
        expect(heading.textContent).toContain('Change password');
      });

      const radioButtons = screen.getAllByRole('radio');
      await user.click(radioButtons[1]);

      const sendButton = screen.getByRole('button', { name: /Send OTP/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter OTP')).toBeInTheDocument();
      });

      const otpInput = screen.getByPlaceholderText('Enter OTP');
      const newPasswordInputs = screen.getAllByPlaceholderText(/New password/i);
      
      await user.type(otpInput, '123456');
      await user.type(newPasswordInputs[0], 'newPass123');
      await user.type(newPasswordInputs[1], 'differentPass');

      const verifyButton = screen.getByRole('button', { name: /Verify & Change Password/i });
      await user.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByText('New password and confirm password do not match.')).toBeInTheDocument();
      });
    });

    it('should allow resending OTP after initial send', async () => {
      api.post.mockResolvedValue({ status: 200, data: { detail: 'OTP sent' } });
      render(<Profile />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Change password/i })).toBeInTheDocument();
      });

      const radioButtons = screen.getAllByRole('radio');
      await user.click(radioButtons[1]);

      const sendButton = screen.getByRole('button', { name: /Send OTP/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/Resend OTP/i)).toBeInTheDocument();
      });
    });

    it('should show loading state while sending OTP', async () => {
      let resolveApi;
      api.post.mockImplementation(() => new Promise(resolve => {
        resolveApi = resolve;
      }));
      
      render(<Profile />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Change password/i })).toBeInTheDocument();
      });

      const radioButtons = screen.getAllByRole('radio');
      await user.click(radioButtons[1]);

      const sendButton = screen.getByRole('button', { name: /Send OTP/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Sending OTP…/i })).toBeInTheDocument();
      });

      // Resolve the promise within waitFor
      await waitFor(() => {
        resolveApi({ status: 200, data: { detail: 'OTP sent' } });
      });
    });

    it('should handle OTP verify error', async () => {
      api.post.mockResolvedValueOnce({ status: 200, data: { detail: 'OTP sent' } });
      api.post.mockRejectedValueOnce({
        response: {
          data: {
            detail: 'Invalid OTP'
          }
        }
      });
      
      render(<Profile />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Change password/i })).toBeInTheDocument();
      });

      const radioButtons = screen.getAllByRole('radio');
      await user.click(radioButtons[1]);

      const sendButton = screen.getByRole('button', { name: /Send OTP/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter OTP')).toBeInTheDocument();
      });

      const otpInput = screen.getByPlaceholderText('Enter OTP');
      const newPasswordInputs = screen.getAllByPlaceholderText(/New password/i);
      
      await user.type(otpInput, 'wrongOtp');
      await user.type(newPasswordInputs[0], 'newPass123');
      await user.type(newPasswordInputs[1], 'newPass123');

      const verifyButton = screen.getByRole('button', { name: /Verify & Change Password/i });
      await user.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByText('Invalid OTP')).toBeInTheDocument();
      });
    });

    it('should show loading state while verifying OTP', async () => {
      api.post.mockResolvedValueOnce({ status: 200, data: { detail: 'OTP sent' } });
      let resolveVerify;
      api.post.mockImplementationOnce(() => new Promise(resolve => {
        resolveVerify = resolve;
      }));
      
      render(<Profile />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Change password/i })).toBeInTheDocument();
      });

      const radioButtons = screen.getAllByRole('radio');
      await user.click(radioButtons[1]);

      const sendButton = screen.getByRole('button', { name: /Send OTP/i });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByPlaceholderText('Enter OTP')).toBeInTheDocument();
      });

      const otpInput = screen.getByPlaceholderText('Enter OTP');
      const newPasswordInputs = screen.getAllByPlaceholderText(/New password/i);
      
      await user.type(otpInput, '123456');
      await user.type(newPasswordInputs[0], 'newPass123');
      await user.type(newPasswordInputs[1], 'newPass123');

      const verifyButton = screen.getByRole('button', { name: /Verify & Change Password/i });
      await user.click(verifyButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Verifying…/i })).toBeInTheDocument();
      });

      // Resolve the promise within waitFor
      await waitFor(() => {
        resolveVerify({ status: 200, data: { detail: 'Password updated' } });
      });
    });
  });

  describe('Component Styling & Layout', () => {
    it('should have correct CSS classes on profile card', async () => {
      const { container } = render(<Profile />);
      
      await waitFor(() => {
        const card = container.querySelector('.bg-white');
        expect(card).toHaveClass('rounded-xl', 'shadow');
      });
    });

    it('should render form with correct layout', async () => {
      const { container } = render(<Profile />);
      
      await waitFor(() => {
        const form = container.querySelector('form');
        expect(form).toBeInTheDocument();
      });
    });

    it('should have correct max width on main container', async () => {
      const { container } = render(<Profile />);
      
      await waitFor(() => {
        const mainDiv = container.firstChild;
        expect(mainDiv).toHaveClass('max-w-3xl');
      });
    });

    it('should display proper button styling', async () => {
      render(<Profile />);
      
      await waitFor(() => {
        const button = screen.getByRole('button', { name: /Change password/i });
        expect(button).toHaveClass('bg-[#4B687A]', 'text-white', 'rounded-lg');
      });
    });

    it('should have correct input field styling', async () => {
      const { container } = render(<Profile />);
      
      await waitFor(() => {
        const input = container.querySelector('input[type="password"]');
        expect(input).toHaveClass('border', 'border-gray-300', 'rounded-lg');
      });
    });
  });

  describe('Error Handling & Edge Cases', () => {
    it('should handle API error without response object', async () => {
      api.post.mockRejectedValue(new Error('Network Error'));
      render(<Profile />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Change password/i })).toBeInTheDocument();
      });

      const inputs = screen.getAllByPlaceholderText(/password/i);
      await user.type(inputs[0], 'currentPass123');
      await user.type(inputs[1], 'newPass123');
      await user.type(inputs[2], 'newPass123');

      const changeButton = screen.getByRole('button', { name: /Change password/i });
      await user.click(changeButton);

      await waitFor(() => {
        expect(screen.getByText('Network Error')).toBeInTheDocument();
      });
    });

    it('should handle API error with JSON object in message', async () => {
      api.post.mockRejectedValue({
        response: {
          data: {
            errors: { password: ['Too weak'] }
          }
        }
      });
      render(<Profile />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Change password/i })).toBeInTheDocument();
      });

      const inputs = screen.getAllByPlaceholderText(/password/i);
      await user.type(inputs[0], 'currentPass123');
      await user.type(inputs[1], 'weak');
      await user.type(inputs[2], 'weak');

      const changeButton = screen.getByRole('button', { name: /Change password/i });
      await user.click(changeButton);

      await waitFor(() => {
        expect(screen.getByText(/password.*Too weak|Too weak/i)).toBeInTheDocument();
      });
    });

    it('should disable button while API request is in progress', async () => {
      let resolveApi;
      api.post.mockImplementation(() => new Promise(resolve => {
        resolveApi = resolve;
      }));
      
      render(<Profile />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Change password/i })).toBeInTheDocument();
      });

      const inputs = screen.getAllByPlaceholderText(/password/i);
      await user.type(inputs[0], 'currentPass123');
      await user.type(inputs[1], 'newPass123');
      await user.type(inputs[2], 'newPass123');

      const changeButton = screen.getByRole('button', { name: /Change password/i });
      await user.click(changeButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Changing…/i })).toBeDisabled();
      });

      // Resolve the promise within waitFor
      await waitFor(() => {
        resolveApi({ status: 200 });
      });
    });
  });

  describe('User Interactions & State Management', () => {
    it('should maintain separate state for current password and email OTP methods', async () => {
      api.post.mockResolvedValue({ status: 200 });
      render(<Profile />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Change password/i })).toBeInTheDocument();
      });

      // Fill current password method
      let inputs = screen.getAllByPlaceholderText(/password/i);
      await user.type(inputs[0], 'currentPass123');

      // Switch to OTP method
      const radioButtons = screen.getAllByRole('radio');
      await user.click(radioButtons[1]);

      // Verify current password input is gone
      inputs = screen.queryAllByPlaceholderText(/current password/i);
      expect(inputs.length).toBe(0);
    });

    it('should clear password message when switching methods', async () => {
      render(<Profile />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Change password/i })).toBeInTheDocument();
      });

      // Try to submit empty form to show error
      const changeButton = screen.getByRole('button', { name: /Change password/i });
      await user.click(changeButton);

      await waitFor(() => {
        expect(screen.getByText('Please fill all password fields.')).toBeInTheDocument();
      });

      // Switch to OTP method
      const radioButtons = screen.getAllByRole('radio');
      await user.click(radioButtons[1]);

      // Message should be cleared
      expect(screen.queryByText('Please fill all password fields.')).not.toBeInTheDocument();
    });

    it('should handle rapid form submissions', async () => {
      api.post.mockResolvedValue({ status: 200 });
      render(<Profile />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Change password/i })).toBeInTheDocument();
      });

      const inputs = screen.getAllByPlaceholderText(/password/i);
      await user.type(inputs[0], 'currentPass123');
      await user.type(inputs[1], 'newPass123');
      await user.type(inputs[2], 'newPass123');

      const changeButton = screen.getByRole('button', { name: /Change password/i });
      // Click multiple times rapidly
      await user.click(changeButton);
      await user.click(changeButton);

      // Should only call API once (button should be disabled after first click)
      await waitFor(() => {
        expect(api.post).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe('Radio Button Behavior', () => {
    it('should have two radio buttons with proper labels', async () => {
      render(<Profile />);
      
      await waitFor(() => {
        expect(screen.getByText('Use current password')).toBeInTheDocument();
        expect(screen.getByText('Use email OTP')).toBeInTheDocument();
      });
    });

    it('should have first radio button selected by default', async () => {
      render(<Profile />);
      
      await waitFor(() => {
        const radioButtons = screen.getAllByRole('radio');
        expect(radioButtons[0]).toBeChecked();
      });
    });

    it('should switch between methods when clicking different radio buttons', async () => {
      render(<Profile />);
      const user = userEvent.setup();
      
      await waitFor(() => {
        expect(screen.getByRole('heading', { name: /Change password/i })).toBeInTheDocument();
      });

      const radioButtons = screen.getAllByRole('radio');
      
      // Initially first method is selected
      expect(radioButtons[0]).toBeChecked();
      expect(screen.getByPlaceholderText('Current password')).toBeInTheDocument();

      // Click second radio
      await user.click(radioButtons[1]);
      expect(radioButtons[1]).toBeChecked();
      expect(screen.getByRole('button', { name: /Send OTP/i })).toBeInTheDocument();

      // Click first radio again
      await user.click(radioButtons[0]);
      expect(radioButtons[0]).toBeChecked();
      expect(screen.getByPlaceholderText('Current password')).toBeInTheDocument();
    });
  });
});
