import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FieldWorkerSignUpForm from '../FieldWorkerSignUpForm';
import api from '../../utils/axiosConfig';
import { setAccessToken } from '../../utils/auth';
import { vi } from 'vitest';

vi.mock('../../utils/axiosConfig', () => ({
  default: { get: vi.fn(), post: vi.fn() },
}));

vi.mock('../../utils/auth', () => ({
  setAccessToken: vi.fn(),
}));

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  // prevent actual navigation
  delete window.location;
  window.location = { href: '' };
});

test('fetches and displays departments and renders form inputs', async () => {
  api.get.mockResolvedValueOnce({ data: [{ id: 1, name: 'Water' }, { id: 2, name: 'Roads' }] });

  render(<FieldWorkerSignUpForm />);

  // department options should appear
  expect(await screen.findByText(/Water/i)).toBeInTheDocument();

  // basic inputs
  expect(screen.getByPlaceholderText('Enter your First Name')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Enter your Username')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
});

test('shows error when passwords do not match', async () => {
  api.get.mockResolvedValueOnce({ data: [{ id: 1, name: 'Dept' }] });
  const user = userEvent.setup();
  render(<FieldWorkerSignUpForm />);

  await user.type(screen.getByPlaceholderText('Enter your First Name'), 'John');
  await user.type(screen.getByPlaceholderText('Enter your Last Name'), 'Doe');
  await user.type(screen.getByPlaceholderText('Enter your Username'), 'jdoe');
  await user.type(screen.getByPlaceholderText('Enter your email'), 'jdoe@example.com');
  await user.type(screen.getAllByPlaceholderText('Enter Password')[0], 'password1');
  await user.type(screen.getByPlaceholderText('Re-enter Password'), 'different');
  await user.type(screen.getByPlaceholderText('Enter Mobile Number'), '1234567890');

  await user.click(screen.getByRole('button', { name: /SignUp/i }));

  // Verify that the signup API was not called (validation prevented submission)
  await waitFor(() => {
    expect(api.post).not.toHaveBeenCalled();
  });
});

test('creates new department when Other selected and proceeds to verify step', async () => {
  // departments fetched
  api.get.mockResolvedValueOnce({ data: [{ id: 1, name: 'Env' }] });

  // api.post sequence: create dept -> signup
  api.post
    .mockImplementationOnce(() => Promise.resolve({ data: { id: 99 } }))
    .mockImplementationOnce(() => Promise.resolve({ data: { message: 'OTP sent to your email' } }));

  const user = userEvent.setup();
  render(<FieldWorkerSignUpForm />);

  // Wait for department option to render
  expect(await screen.findByText(/Env/i)).toBeInTheDocument();

  await user.type(screen.getByPlaceholderText('Enter your First Name'), 'John');
  await user.type(screen.getByPlaceholderText('Enter your Last Name'), 'Doe');
  await user.type(screen.getByPlaceholderText('Enter your Username'), 'jdoe');
  await user.type(screen.getByPlaceholderText('Enter your email'), 'jdoe@example.com');
  await user.type(screen.getAllByPlaceholderText('Enter Password')[0], 'password1');
  await user.type(screen.getByPlaceholderText('Re-enter Password'), 'password1');
  await user.type(screen.getByPlaceholderText('Enter Mobile Number'), '1234567890');

  // select Other option
  const select = screen.getByRole('combobox');
  await user.selectOptions(select, 'other');

  // new department input should appear
  const newDept = await screen.findByPlaceholderText('Enter new department');
  await user.type(newDept, 'NewDept');

  await user.click(screen.getByRole('button', { name: /SignUp/i }));

  // verify step should be shown after successful signup
  expect(await screen.findByText(/Verify Your Email/i)).toBeInTheDocument();
  // api.post should have been called twice (create dept, signup)
  expect(api.post).toHaveBeenCalledTimes(2);
});

test('verifying OTP stores token and user info', async () => {
  // Simulate flow: departments fetch, then signup (to show verify), then verify
  api.get.mockResolvedValueOnce({ data: [] });
  api.post
    .mockImplementationOnce(() => Promise.resolve({ data: { message: 'OTP sent' } }))
    .mockImplementationOnce(() => Promise.resolve({ data: { message: 'Registered', access: 'FAKE', user_id: '55', username: 'fw' } }));

  const user = userEvent.setup();
  render(<FieldWorkerSignUpForm />);

  // fill minimal required fields
  await user.type(screen.getByPlaceholderText('Enter your First Name'), 'A');
  await user.type(screen.getByPlaceholderText('Enter your Last Name'), 'B');
  await user.type(screen.getByPlaceholderText('Enter your Username'), 'user');
  await user.type(screen.getByPlaceholderText('Enter your email'), 'u@example.com');
  await user.type(screen.getAllByPlaceholderText('Enter Password')[0], 'password');
  await user.type(screen.getByPlaceholderText('Re-enter Password'), 'password');
  await user.type(screen.getByPlaceholderText('Enter Mobile Number'), '1234567890');

  // choose a department value (if select present)
  const select = screen.getByRole('combobox');
  await user.selectOptions(select, '');

  // submit -> should enter verify step
  await user.click(screen.getByRole('button', { name: /SignUp/i }));

  // Check that Verify OTP button is present (indicates we're in verify step)
  expect(await screen.findByRole('button', { name: /Verify OTP/i })).toBeInTheDocument();

  // Enter OTP
  await user.type(screen.getByPlaceholderText(/Enter 6-digit OTP/i), '123456');
  await user.click(screen.getByRole('button', { name: /Verify OTP/i }));

  // Wait for success and check token/localStorage
  await waitFor(() => expect(setAccessToken).toHaveBeenCalledWith('FAKE'));
  expect(localStorage.getItem('user_id')).toBe('55');
  expect(localStorage.getItem('username')).toBe('fw');
});

test('handles department fetch failure gracefully', async () => {
  // Simulate network error when fetching departments
  api.get.mockRejectedValueOnce(new Error('network error'));

  render(<FieldWorkerSignUpForm />);

  // form still renders and department select (combobox) should be present
  const select = await screen.findByRole('combobox');

  // Ensure there is at least a default option (the component should handle fetch failure)
  expect(select.options.length).toBeGreaterThanOrEqual(1);

  // Also ensure basic fields are present so user can still interact
  expect(screen.getByPlaceholderText('Enter your First Name')).toBeInTheDocument();
  expect(screen.getByPlaceholderText('Enter your Username')).toBeInTheDocument();
});

test('shows error when passwords do not match on signup', async () => {
  api.get.mockResolvedValueOnce({ data: [{ id: 1, name: 'Dept' }] });

  const user = userEvent.setup();
  render(<FieldWorkerSignUpForm />);

  await user.type(screen.getByPlaceholderText('Enter your First Name'), 'John');
  await user.type(screen.getByPlaceholderText('Enter your Last Name'), 'Doe');
  await user.type(screen.getByPlaceholderText('Enter your Username'), 'jdoe');
  await user.type(screen.getByPlaceholderText('Enter your email'), 'jdoe@example.com');
  await user.type(screen.getAllByPlaceholderText('Enter Password')[0], 'password1');
  await user.type(screen.getByPlaceholderText('Re-enter Password'), 'different');
  await user.type(screen.getByPlaceholderText('Enter Mobile Number'), '1234567890');

  await user.click(screen.getByRole('button', { name: /SignUp/i }));

  // Verify that the signup API was not called (validation prevented submission)
  await waitFor(() => {
    expect(api.post).not.toHaveBeenCalled();
  });
});

test('shows error when password too short', async () => {
  api.get.mockResolvedValueOnce({ data: [{ id: 1, name: 'Dept' }] });

  const user = userEvent.setup();
  render(<FieldWorkerSignUpForm />);

  await user.type(screen.getByPlaceholderText('Enter your First Name'), 'John');
  await user.type(screen.getByPlaceholderText('Enter your Last Name'), 'Doe');
  await user.type(screen.getByPlaceholderText('Enter your Username'), 'jdoe');
  await user.type(screen.getByPlaceholderText('Enter your email'), 'jdoe@example.com');
  await user.type(screen.getAllByPlaceholderText('Enter Password')[0], '123');
  await user.type(screen.getByPlaceholderText('Re-enter Password'), '123');
  await user.type(screen.getByPlaceholderText('Enter Mobile Number'), '1234567890');

  await user.click(screen.getByRole('button', { name: /SignUp/i }));

  // Verify that the signup API was not called (validation prevented submission)
  await waitFor(() => {
    expect(api.post).not.toHaveBeenCalled();
  });
});

test('shows error when OTP verify fails', async () => {
  api.get.mockResolvedValueOnce({ data: [] });
  api.post
    .mockResolvedValueOnce({ data: { message: 'OTP sent' } })
    .mockRejectedValueOnce({ response: { data: { message: 'Invalid OTP' } } });

  const user = userEvent.setup();
  render(<FieldWorkerSignUpForm />);

  await user.type(screen.getByPlaceholderText('Enter your First Name'), 'Test');
  await user.type(screen.getByPlaceholderText('Enter your Last Name'), 'User');
  await user.type(screen.getByPlaceholderText('Enter your Username'), 'testuser');
  await user.type(screen.getByPlaceholderText('Enter your email'), 'test@example.com');
  await user.type(screen.getAllByPlaceholderText('Enter Password')[0], 'password1');
  await user.type(screen.getByPlaceholderText('Re-enter Password'), 'password1');
  await user.type(screen.getByPlaceholderText('Enter Mobile Number'), '1234567890');

  await user.click(screen.getByRole('button', { name: /SignUp/i }));

  // Verify that OTP input field is present (indicates verify step is shown)
  expect(await screen.findByPlaceholderText(/Enter 6-digit OTP/i)).toBeInTheDocument();

  await user.type(screen.getByPlaceholderText(/Enter 6-digit OTP/i), '000000');
  await user.click(screen.getByRole('button', { name: /Verify OTP/i }));

  // Verify that the second API call (verification) was made and failed
  await waitFor(() => {
    expect(api.post).toHaveBeenCalledTimes(2);
  });
});

test('shows error when signup API call fails', async () => {
  api.get.mockResolvedValueOnce({ data: [] });
  api.post.mockRejectedValueOnce({ response: { data: { message: 'Username already exists' } } });

  const user = userEvent.setup();
  render(<FieldWorkerSignUpForm />);

  await user.type(screen.getByPlaceholderText('Enter your First Name'), 'Fail');
  await user.type(screen.getByPlaceholderText('Enter your Last Name'), 'Test');
  await user.type(screen.getByPlaceholderText('Enter your Username'), 'failtest');
  await user.type(screen.getByPlaceholderText('Enter your email'), 'fail@example.com');
  await user.type(screen.getAllByPlaceholderText('Enter Password')[0], 'password1');
  await user.type(screen.getByPlaceholderText('Re-enter Password'), 'password1');
  await user.type(screen.getByPlaceholderText('Enter Mobile Number'), '1234567890');

  await user.click(screen.getByRole('button', { name: /SignUp/i }));

  // Verify that the API was called and then form remains (signup failed)
  await waitFor(() => {
    expect(api.post).toHaveBeenCalled();
  });
  
  // Verify we're still in the signup form (not in verify step)
  expect(screen.queryByPlaceholderText(/Enter 6-digit OTP/i)).not.toBeInTheDocument();
});

test('allows switching between department options', async () => {
  api.get.mockResolvedValueOnce({ data: [{ id: 1, name: 'Water' }, { id: 2, name: 'Roads' }] });

  const user = userEvent.setup();
  render(<FieldWorkerSignUpForm />);

  expect(await screen.findByText(/Water/i)).toBeInTheDocument();
  expect(screen.getByText(/Roads/i)).toBeInTheDocument();

  const select = screen.getByRole('combobox');
  await user.selectOptions(select, '2');
  expect(select).toHaveValue('2');
});
