import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import AdminSignUpForm from '../AdminSignUpForm';

describe('AdminSignUpForm Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========== Rendering Tests ==========

  it('should render the form without crashing', () => {
    render(<AdminSignUpForm />);
    expect(screen.getByRole('button', { name: /SignUp/i })).toBeInTheDocument();
  });

  it('should render all input fields', () => {
    render(<AdminSignUpForm />);
    expect(screen.getByPlaceholderText('Enter your Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Password')).toBeInTheDocument();
  });

  it('should render submit button with correct text', () => {
    render(<AdminSignUpForm />);
    const submitButton = screen.getByRole('button', { name: /SignUp/i });
    expect(submitButton).toBeInTheDocument();
    expect(submitButton.textContent).toBe('SignUp');
  });

  it('should render password visibility toggle button', () => {
    render(<AdminSignUpForm />);
    const toggleButton = screen.getByRole('button', { name: /👁️/i });
    expect(toggleButton).toBeInTheDocument();
  });

  // ========== Form Input Tests ==========

  it('should update username input on change', async () => {
    render(<AdminSignUpForm />);
    const usernameInput = screen.getByPlaceholderText('Enter your Name');
    const user = userEvent.setup();

    await user.type(usernameInput, 'admin_user');
    expect(usernameInput).toHaveValue('admin_user');
  });

  it('should update email input on change', async () => {
    render(<AdminSignUpForm />);
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const user = userEvent.setup();

    await user.type(emailInput, 'admin@example.com');
    expect(emailInput).toHaveValue('admin@example.com');
  });

  it('should update password input on change', async () => {
    render(<AdminSignUpForm />);
    const passwordInput = screen.getByPlaceholderText('Enter Password');
    const user = userEvent.setup();

    await user.type(passwordInput, 'SecurePass123');
    expect(passwordInput).toHaveValue('SecurePass123');
  });

  it('should accept all three fields together', async () => {
    render(<AdminSignUpForm />);
    const user = userEvent.setup();

    const usernameInput = screen.getByPlaceholderText('Enter your Name');
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter Password');

    await user.type(usernameInput, 'testadmin');
    await user.type(emailInput, 'testadmin@example.com');
    await user.type(passwordInput, 'TestPass123');

    expect(usernameInput).toHaveValue('testadmin');
    expect(emailInput).toHaveValue('testadmin@example.com');
    expect(passwordInput).toHaveValue('TestPass123');
  });

  // ========== Password Visibility Tests ==========

  it('should toggle password visibility when button is clicked', async () => {
    render(<AdminSignUpForm />);
    const user = userEvent.setup();
    const passwordInput = screen.getByPlaceholderText('Enter Password');
    const toggleButton = screen.getByRole('button', { name: /👁️/i });

    // Initially password should be hidden (type="password")
    expect(passwordInput).toHaveAttribute('type', 'password');

    // Click to show password
    await user.click(toggleButton);
    await waitFor(() => {
      expect(passwordInput).toHaveAttribute('type', 'text');
    });

    // Click again to hide password
    await user.click(toggleButton);
    await waitFor(() => {
      expect(passwordInput).toHaveAttribute('type', 'password');
    });
  });

  it('should change password icon from eye to monkey when toggled', async () => {
    render(<AdminSignUpForm />);
    const user = userEvent.setup();
    const toggleButton = screen.getByRole('button', { name: /👁️/i });

    // Initially shows eye icon
    expect(toggleButton.textContent).toContain('👁️');

    // Click to show password
    await user.click(toggleButton);
    await waitFor(() => {
      expect(toggleButton.textContent).toContain('🙈');
    });

    // Click again to hide password
    await user.click(toggleButton);
    await waitFor(() => {
      expect(toggleButton.textContent).toContain('👁️');
    });
  });

  // ========== Form Submission Tests ==========

  it('should submit form with all fields filled', async () => {
    render(<AdminSignUpForm />);
    const user = userEvent.setup();

    const usernameInput = screen.getByPlaceholderText('Enter your Name');
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter Password');
    const submitButton = screen.getByRole('button', { name: /SignUp/i });

    await user.type(usernameInput, 'admin_test');
    await user.type(emailInput, 'admin@test.com');
    await user.type(passwordInput, 'AdminPass123');

    await user.click(submitButton);

    // Should show success message after form submission
    await waitFor(() => {
      expect(screen.getByText('Admin registration submitted!')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should show loading state during submission', async () => {
    render(<AdminSignUpForm />);
    const user = userEvent.setup();

    const usernameInput = screen.getByPlaceholderText('Enter your Name');
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter Password');
    const submitButton = screen.getByRole('button', { name: /SignUp/i });

    await user.type(usernameInput, 'admin_test');
    await user.type(emailInput, 'admin@test.com');
    await user.type(passwordInput, 'AdminPass123');

    await user.click(submitButton);

    // Button should show loading state
    expect(screen.getByRole('button', { name: /Signing Up/i })).toBeInTheDocument();
  });

  it('should disable inputs during form submission', async () => {
    render(<AdminSignUpForm />);
    const user = userEvent.setup();

    const usernameInput = screen.getByPlaceholderText('Enter your Name');
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter Password');
    const submitButton = screen.getByRole('button', { name: /SignUp/i });

    await user.type(usernameInput, 'admin_test');
    await user.type(emailInput, 'admin@test.com');
    await user.type(passwordInput, 'AdminPass123');

    // Inputs should not be disabled before submission
    expect(usernameInput).not.toBeDisabled();
    expect(emailInput).not.toBeDisabled();
    expect(passwordInput).not.toBeDisabled();

    await user.click(submitButton);

    // Inputs should be disabled during submission
    await waitFor(() => {
      expect(usernameInput).toBeDisabled();
      expect(emailInput).toBeDisabled();
      expect(passwordInput).toBeDisabled();
    });
  });

  it('should disable password toggle button during submission', async () => {
    render(<AdminSignUpForm />);
    const user = userEvent.setup();

    const usernameInput = screen.getByPlaceholderText('Enter your Name');
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter Password');
    const submitButton = screen.getByRole('button', { name: /SignUp/i });
    const toggleButton = screen.getByRole('button', { name: /👁️/i });

    await user.type(usernameInput, 'admin_test');
    await user.type(emailInput, 'admin@test.com');
    await user.type(passwordInput, 'AdminPass123');

    // Toggle button should not be disabled before submission
    expect(toggleButton).not.toBeDisabled();

    await user.click(submitButton);

    // Toggle button should be disabled during submission
    await waitFor(() => {
      expect(toggleButton).toBeDisabled();
    });
  });

  it('should disable submit button during form submission', async () => {
    render(<AdminSignUpForm />);
    const user = userEvent.setup();

    const usernameInput = screen.getByPlaceholderText('Enter your Name');
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter Password');
    const submitButton = screen.getByRole('button', { name: /SignUp/i });

    await user.type(usernameInput, 'admin_test');
    await user.type(emailInput, 'admin@test.com');
    await user.type(passwordInput, 'AdminPass123');

    expect(submitButton).not.toBeDisabled();

    await user.click(submitButton);

    // Submit button should be disabled during submission
    await waitFor(() => {
      expect(submitButton).toBeDisabled();
    });
  });

  it('should clear loading state and re-enable form after submission', async () => {
    render(<AdminSignUpForm />);
    const user = userEvent.setup();

    const usernameInput = screen.getByPlaceholderText('Enter your Name');
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter Password');
    const submitButton = screen.getByRole('button', { name: /SignUp/i });

    await user.type(usernameInput, 'admin_test');
    await user.type(emailInput, 'admin@test.com');
    await user.type(passwordInput, 'AdminPass123');

    await user.click(submitButton);

    // Wait for loading to complete
    await waitFor(() => {
      expect(screen.getByText('Admin registration submitted!')).toBeInTheDocument();
    }, { timeout: 2000 });

    // After submission, button should show "SignUp" again
    const newSubmitButton = screen.getByRole('button', { name: /SignUp/i });
    expect(newSubmitButton).not.toBeDisabled();
  });

  // ========== Form Validation Tests ==========

  it('should have required attribute on all inputs', () => {
    render(<AdminSignUpForm />);

    const usernameInput = screen.getByPlaceholderText('Enter your Name');
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter Password');

    expect(usernameInput).toHaveAttribute('required');
    expect(emailInput).toHaveAttribute('required');
    expect(passwordInput).toHaveAttribute('required');
  });

  it('should not submit form with empty fields', async () => {
    render(<AdminSignUpForm />);
    const user = userEvent.setup();
    const submitButton = screen.getByRole('button', { name: /SignUp/i });

    // Try to submit without filling any fields
    await user.click(submitButton);

    // Should not show success message
    await waitFor(() => {
      expect(screen.queryByText('Admin registration submitted!')).not.toBeInTheDocument();
    }, { timeout: 500 });
  });

  // ========== Accessibility Tests ==========

  it('should have proper form structure', () => {
    const { container } = render(<AdminSignUpForm />);
    const form = container.querySelector('form');
    expect(form).toBeInTheDocument();
  });

  it('should have properly labeled input fields with placeholders', () => {
    render(<AdminSignUpForm />);

    expect(screen.getByPlaceholderText('Enter your Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter Password')).toBeInTheDocument();
  });

  it('should render submit button as type submit', () => {
    render(<AdminSignUpForm />);
    const submitButton = screen.getByRole('button', { name: /SignUp/i });
    expect(submitButton).toHaveAttribute('type', 'submit');
  });

  // ========== CSS and Styling Tests ==========

  it('should have appropriate CSS classes on form elements', () => {
    const { container } = render(<AdminSignUpForm />);

    const form = container.querySelector('form.auth-form');
    expect(form).toBeInTheDocument();

    const wrapper = container.querySelector('.auth-wrapper');
    expect(wrapper).toBeInTheDocument();
  });

  it('should apply disabled styles to inputs during loading', async () => {
    render(<AdminSignUpForm />);
    const user = userEvent.setup();

    const usernameInput = screen.getByPlaceholderText('Enter your Name');
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter Password');
    const submitButton = screen.getByRole('button', { name: /SignUp/i });

    await user.type(usernameInput, 'admin_test');
    await user.type(emailInput, 'admin@test.com');
    await user.type(passwordInput, 'AdminPass123');

    await user.click(submitButton);

    await waitFor(() => {
      expect(usernameInput).toHaveClass('disabled:opacity-50');
      expect(emailInput).toHaveClass('disabled:opacity-50');
      expect(passwordInput).toHaveClass('disabled:opacity-50');
    });
  });

  // ========== Edge Cases ==========

  it('should handle rapid form submissions', async () => {
    render(<AdminSignUpForm />);
    const user = userEvent.setup();

    const usernameInput = screen.getByPlaceholderText('Enter your Name');
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter Password');
    const submitButton = screen.getByRole('button', { name: /SignUp/i });

    await user.type(usernameInput, 'admin_test');
    await user.type(emailInput, 'admin@test.com');
    await user.type(passwordInput, 'AdminPass123');

    // Try to click submit multiple times
    await user.click(submitButton);
    await user.click(submitButton);
    await user.click(submitButton);

    // Should still show only one success message
    await waitFor(() => {
      const messages = screen.getAllByText('Admin registration submitted!');
      expect(messages.length).toBe(1);
    }, { timeout: 2000 });
  });

  it('should allow form resubmission after successful submission', async () => {
    render(<AdminSignUpForm />);
    const user = userEvent.setup();

    const usernameInput = screen.getByPlaceholderText('Enter your Name');
    const emailInput = screen.getByPlaceholderText('Enter your email');
    const passwordInput = screen.getByPlaceholderText('Enter Password');
    const submitButton = screen.getByRole('button', { name: /SignUp/i });

    // First submission
    await user.type(usernameInput, 'admin_test1');
    await user.type(emailInput, 'admin1@test.com');
    await user.type(passwordInput, 'AdminPass123');
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText('Admin registration submitted!')).toBeInTheDocument();
    }, { timeout: 2000 });

    // Clear form
    await user.clear(usernameInput);
    await user.clear(emailInput);
    await user.clear(passwordInput);

    // Second submission
    await user.type(usernameInput, 'admin_test2');
    await user.type(emailInput, 'admin2@test.com');
    await user.type(passwordInput, 'AdminPass456');
    await user.click(submitButton);

    await waitFor(() => {
      // Should show success message again
      expect(screen.getByText('Admin registration submitted!')).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it('should display snapshot of initial render', () => {
    const { container } = render(<AdminSignUpForm />);
    expect(container).toMatchSnapshot();
  });
});
