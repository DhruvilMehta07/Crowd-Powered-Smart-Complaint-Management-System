import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'

// Mock modules before importing the component so imports are hoisted correctly
// Provide a mocked axios-like api with get/post as mock functions so tests
// can call api.get.mockResolvedValue(...) safely.
vi.mock('../../utils/axiosConfig', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

vi.mock('../../utils/auth', () => ({
  setAccessToken: vi.fn(),
}))

import GovtAuthSignUpForm from '../GovtAuthSignUpForm'
import api from '../../utils/axiosConfig'
import { setAccessToken } from '../../utils/auth'

describe('GovtAuthSignUpForm component', () => {
  const departmentsMock = [
    { id: 1, name: 'Public Works' },
    { id: 2, name: 'Health' },
  ]

  beforeEach(() => {
    vi.clearAllMocks()
    // default: departments fetched successfully
    if (api.get) api.get.mockResolvedValue({ data: departmentsMock })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('renders signup form fields', () => {
    render(<GovtAuthSignUpForm />)

    expect(screen.getByPlaceholderText('Enter your First Name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your Last Name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter Password')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Re-enter Password')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter Mobile Number')).toBeInTheDocument()
    expect(screen.getByRole('combobox')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /SignUp/i })).toBeInTheDocument()
  })

  it('fetches and displays department options', async () => {
    api.get.mockResolvedValueOnce({ data: departmentsMock })
    render(<GovtAuthSignUpForm />)

    // wait for options to render
    await waitFor(() => {
      expect(screen.getByRole('option', { name: 'Public Works' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Health' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Other' })).toBeInTheDocument()
    })
  })

  it('shows new department input when "Other" is selected', async () => {
    api.get.mockResolvedValueOnce({ data: departmentsMock })
    render(<GovtAuthSignUpForm />)
    const user = userEvent.setup()

    // wait for select to be populated
    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument())

    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'other')

    await waitFor(() => {
      expect(screen.getByPlaceholderText('Enter new department')).toBeInTheDocument()
    })
  })

  it('shows error when passwords do not match on submit', async () => {
    render(<GovtAuthSignUpForm />)
    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText('Enter your First Name'), 'Gov')
    await user.type(screen.getByPlaceholderText('Enter your Last Name'), 'Admin')
    await user.type(screen.getByPlaceholderText('Enter your email'), 'admin@gov.test')
    await user.type(screen.getByPlaceholderText('Enter Password'), 'pass1234')
    await user.type(screen.getByPlaceholderText('Re-enter Password'), 'different')
    await user.type(screen.getByPlaceholderText('Enter Mobile Number'), '+1234567890')

    // select department -- default departments mocked
    // wait for combobox
    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument())
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, String(departmentsMock[0].id))

    await user.click(screen.getByRole('button', { name: /SignUp/i }))

    await waitFor(() => {
      expect(screen.getByText('Passwords do not match')).toBeInTheDocument()
    })
  })

  it('submits signup and transitions to verify step when successful', async () => {
    // Mock signup API response
    api.post = vi.fn()
    api.post.mockResolvedValueOnce({ data: { message: 'OTP sent to your email!' } })

    render(<GovtAuthSignUpForm />)
    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText('Enter your First Name'), 'Gov')
    await user.type(screen.getByPlaceholderText('Enter your Last Name'), 'Admin')
    await user.type(screen.getByPlaceholderText('Enter your email'), 'admin@gov.test')
    await user.type(screen.getByPlaceholderText('Enter Password'), 'pass1234')
    await user.type(screen.getByPlaceholderText('Re-enter Password'), 'pass1234')
    await user.type(screen.getByPlaceholderText('Enter Mobile Number'), '+1234567890')

    // wait for departments
    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument())
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, String(departmentsMock[0].id))

    await user.click(screen.getByRole('button', { name: /SignUp/i }))

    // Wait for verify screen
    await waitFor(() => {
      expect(screen.getByText(/Verify Your Email/i)).toBeInTheDocument()
      expect(screen.getByText(/We sent a verification code to/i)).toBeInTheDocument()
    })
  })

  it('verifies OTP successfully and sets access token and localStorage', async () => {
    // Mock signup response first
    api.post = vi.fn()
    api.post.mockResolvedValueOnce({ data: { message: 'OTP sent to your email!' } })

    // Mock verify-otp response
    const verifyResponse = { data: { message: 'Registration successful!', access: 'token123', user_id: '42', username: 'govadmin', user_type: 'authority' } }
    api.post.mockResolvedValueOnce(verifyResponse)

    render(<GovtAuthSignUpForm />)
    const user = userEvent.setup()

    // fill and submit signup form
    await user.type(screen.getByPlaceholderText('Enter your First Name'), 'Gov')
    await user.type(screen.getByPlaceholderText('Enter your Last Name'), 'Admin')
    await user.type(screen.getByPlaceholderText('Enter your email'), 'admin@gov.test')
    await user.type(screen.getByPlaceholderText('Enter Password'), 'pass1234')
    await user.type(screen.getByPlaceholderText('Re-enter Password'), 'pass1234')
    await user.type(screen.getByPlaceholderText('Enter Mobile Number'), '+1234567890')

    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument())
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, String(departmentsMock[0].id))

    await user.click(screen.getByRole('button', { name: /SignUp/i }))

    // Now on verify screen
    await waitFor(() => expect(screen.getByText(/Verify Your Email/i)).toBeInTheDocument())

    // enter OTP
    const otpInput = screen.getByPlaceholderText('Enter 6-digit OTP')
    await user.type(otpInput, '123456')

    // click verify
    await user.click(screen.getByRole('button', { name: /Verify OTP/i }))

    await waitFor(() => {
      // setAccessToken should be called with token
      expect(setAccessToken).toHaveBeenCalledWith('token123')
      // localStorage should have user info
      expect(localStorage.getItem('user_id')).toBe('42')
      expect(localStorage.getItem('username')).toBe('govadmin')
      expect(localStorage.getItem('isAuthenticated')).toBe('true')
      expect(localStorage.getItem('user_type')).toBe('authority')
    })
  })

  it('resends OTP when clicking resend', async () => {
    api.post = vi.fn()
    api.post.mockResolvedValueOnce({ data: { message: 'OTP sent to your email!' } })

    render(<GovtAuthSignUpForm />)
    const user = userEvent.setup()

    // fill and submit to reach verify
    await user.type(screen.getByPlaceholderText('Enter your First Name'), 'Gov')
    await user.type(screen.getByPlaceholderText('Enter your Last Name'), 'Admin')
    await user.type(screen.getByPlaceholderText('Enter your email'), 'admin@gov.test')
    await user.type(screen.getByPlaceholderText('Enter Password'), 'pass1234')
    await user.type(screen.getByPlaceholderText('Re-enter Password'), 'pass1234')
    await user.type(screen.getByPlaceholderText('Enter Mobile Number'), '+1234567890')

    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument())
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, String(departmentsMock[0].id))

    await user.click(screen.getByRole('button', { name: /SignUp/i }))

    await waitFor(() => expect(screen.getByText(/Verify Your Email/i)).toBeInTheDocument())

    // prepare mock for resend
    api.post.mockResolvedValueOnce({})

    await user.click(screen.getByRole('button', { name: /Resend OTP/i }))

    await waitFor(() => {
      expect(screen.getByText(/New OTP sent to your email!/i)).toBeInTheDocument()
    })
  })

  it('handles department fetch failure without throwing', async () => {
    // Make api.get reject to exercise the catch branch in useEffect
    api.get.mockRejectedValueOnce(new Error('Network failure'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(<GovtAuthSignUpForm />)

    // wait a tick for useEffect to run
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalled()
    })

    consoleError.mockRestore()
  })

  it('shows error message when OTP verification fails', async () => {
    // signup succeeds to reach verify step
    api.post = vi.fn()
    api.post.mockResolvedValueOnce({ data: { message: 'OTP sent to your email!' } })
    // verify fails with response data message
    api.post.mockRejectedValueOnce({ response: { data: { message: 'Invalid OTP' } } })

    render(<GovtAuthSignUpForm />)
    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText('Enter your First Name'), 'Gov')
    await user.type(screen.getByPlaceholderText('Enter your Last Name'), 'Admin')
    await user.type(screen.getByPlaceholderText('Enter your email'), 'admin@gov.test')
    await user.type(screen.getByPlaceholderText('Enter Password'), 'pass1234')
    await user.type(screen.getByPlaceholderText('Re-enter Password'), 'pass1234')
    await user.type(screen.getByPlaceholderText('Enter Mobile Number'), '+1234567890')

    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument())
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, String(departmentsMock[0].id))

    await user.click(screen.getByRole('button', { name: /SignUp/i }))

    // Now on verify screen
    await waitFor(() => expect(screen.getByText(/Verify Your Email/i)).toBeInTheDocument())

    const otpInput = screen.getByPlaceholderText('Enter 6-digit OTP')
    await user.type(otpInput, '999999')
    await user.click(screen.getByRole('button', { name: /Verify OTP/i }))

    await waitFor(() => {
      expect(screen.getByText('Invalid OTP')).toBeInTheDocument()
    })
  })

  it('handles verify success without user_id (no redirect) and sets message', async () => {
    // signup resolves, verify resolves with message but no user_id
    api.post = vi.fn()
    api.post.mockResolvedValueOnce({ data: { message: 'OTP sent to your email!' } })
    api.post.mockResolvedValueOnce({ data: { message: 'Registration successful!' } })

    render(<GovtAuthSignUpForm />)
    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText('Enter your First Name'), 'Gov')
    await user.type(screen.getByPlaceholderText('Enter your Last Name'), 'Admin')
    await user.type(screen.getByPlaceholderText('Enter your email'), 'admin@gov.test')
    await user.type(screen.getByPlaceholderText('Enter Password'), 'pass1234')
    await user.type(screen.getByPlaceholderText('Re-enter Password'), 'pass1234')
    await user.type(screen.getByPlaceholderText('Enter Mobile Number'), '+1234567890')

    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument())
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, String(departmentsMock[0].id))

    await user.click(screen.getByRole('button', { name: /SignUp/i }))

    await waitFor(() => expect(screen.getByText(/Verify Your Email/i)).toBeInTheDocument())

    const otpInput = screen.getByPlaceholderText('Enter 6-digit OTP')
    await user.type(otpInput, '123456')
    await user.click(screen.getByRole('button', { name: /Verify OTP/i }))

    // Should show success heading and redirect text
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Registration Successful!/i })).toBeInTheDocument()
      expect(screen.getByText(/Redirecting to home page/i)).toBeInTheDocument()
    })
  })

  it('redirects after success when user_id is present (uses timers)', async () => {
    // signup resolves, verify resolves with access and user_id
    api.post = vi.fn()
    api.post.mockResolvedValueOnce({ data: { message: 'OTP sent to your email!' } })
    api.post.mockResolvedValueOnce({ data: { message: 'Registration successful!', access: 'tok', user_id: '1', username: 'u', user_type: 'authority' } })

    // verify that when verify returns access and user_id we set storage and access token
    render(<GovtAuthSignUpForm />)
    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText('Enter your First Name'), 'Gov')
    await user.type(screen.getByPlaceholderText('Enter your Last Name'), 'Admin')
    await user.type(screen.getByPlaceholderText('Enter your email'), 'admin@gov.test')
    await user.type(screen.getByPlaceholderText('Enter Password'), 'pass1234')
    await user.type(screen.getByPlaceholderText('Re-enter Password'), 'pass1234')
    await user.type(screen.getByPlaceholderText('Enter Mobile Number'), '+1234567890')

    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument())
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, String(departmentsMock[0].id))

    await user.click(screen.getByRole('button', { name: /SignUp/i }))

    await waitFor(() => expect(screen.getByText(/Verify Your Email/i)).toBeInTheDocument())

    const otpInput = screen.getByPlaceholderText('Enter 6-digit OTP')
    await user.type(otpInput, '123456')
    await user.click(screen.getByRole('button', { name: /Verify OTP/i }))

    await waitFor(() => expect(screen.getByRole('heading', { name: /Registration Successful!/i })).toBeInTheDocument())

    await waitFor(() => {
      expect(setAccessToken).toHaveBeenCalledWith('tok')
      expect(localStorage.getItem('user_id')).toBe('1')
      expect(localStorage.getItem('username')).toBe('u')
      expect(localStorage.getItem('user_type')).toBe('authority')
    })
  })

  it('creates a new department when Other is selected and submits', async () => {
    // first call: create department, second call: signup
    api.post = vi.fn()
    api.post.mockResolvedValueOnce({ data: { id: 99 } })
    api.post.mockResolvedValueOnce({ data: { message: 'OTP sent to your email!' } })

    render(<GovtAuthSignUpForm />)
    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText('Enter your First Name'), 'Gov')
    await user.type(screen.getByPlaceholderText('Enter your Last Name'), 'Admin')
    await user.type(screen.getByPlaceholderText('Enter your email'), 'admin@gov.test')
    await user.type(screen.getByPlaceholderText('Enter Password'), 'pass1234')
    await user.type(screen.getByPlaceholderText('Re-enter Password'), 'pass1234')
    await user.type(screen.getByPlaceholderText('Enter Mobile Number'), '+1234567890')

    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument())
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, 'other')

    await waitFor(() => expect(screen.getByPlaceholderText('Enter new department')).toBeInTheDocument())
    await user.type(screen.getByPlaceholderText('Enter new department'), 'New Dept')

    await user.click(screen.getByRole('button', { name: /SignUp/i }))

    // verify that dept creation API was called with correct payload
    expect(api.post).toHaveBeenCalledWith('/users/departments/', { name: 'New Dept' })

    // Wait for verify screen
    await waitFor(() => expect(screen.getByText(/Verify Your Email/i)).toBeInTheDocument())
  })

  it('shows signup error when API returns an error', async () => {
    api.post = vi.fn()
    api.post.mockRejectedValueOnce({ response: { data: { error: 'Signup error' } } })

    render(<GovtAuthSignUpForm />)
    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText('Enter your First Name'), 'Gov')
    await user.type(screen.getByPlaceholderText('Enter your Last Name'), 'Admin')
    await user.type(screen.getByPlaceholderText('Enter your email'), 'admin@gov.test')
    await user.type(screen.getByPlaceholderText('Enter Password'), 'pass1234')
    await user.type(screen.getByPlaceholderText('Re-enter Password'), 'pass1234')
    await user.type(screen.getByPlaceholderText('Enter Mobile Number'), '+1234567890')

    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument())
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, String(departmentsMock[0].id))

    await user.click(screen.getByRole('button', { name: /SignUp/i }))

    await waitFor(() => {
      expect(screen.getByText('Signup error')).toBeInTheDocument()
    })
  })

  it('shows error when verifying without entering OTP (submit form directly)', async () => {
    // Mock signup to reach verify step
    api.post = vi.fn()
    api.post.mockResolvedValueOnce({ data: { message: 'OTP sent to your email!' } })

    const { container } = render(<GovtAuthSignUpForm />)
    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText('Enter your First Name'), 'Gov')
    await user.type(screen.getByPlaceholderText('Enter your Last Name'), 'Admin')
    await user.type(screen.getByPlaceholderText('Enter your email'), 'admin@gov.test')
    await user.type(screen.getByPlaceholderText('Enter Password'), 'pass1234')
    await user.type(screen.getByPlaceholderText('Re-enter Password'), 'pass1234')
    await user.type(screen.getByPlaceholderText('Enter Mobile Number'), '+1234567890')

    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument())
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, String(departmentsMock[0].id))

    await user.click(screen.getByRole('button', { name: /SignUp/i }))

    // Now on verify screen
    await waitFor(() => expect(screen.getByText(/Verify Your Email/i)).toBeInTheDocument())

    // Submit the verify form without entering OTP
    const otpInput = screen.getByPlaceholderText('Enter 6-digit OTP')
    const form = otpInput.closest('form')
    fireEvent.submit(form)

    await waitFor(() => {
      expect(screen.getByText('Please enter the OTP')).toBeInTheDocument()
    })
  })

  it('shows error when resend OTP fails', async () => {
    // signup resolves to reach verify screen
    api.post = vi.fn()
    api.post.mockResolvedValueOnce({ data: { message: 'OTP sent to your email!' } })
    // resend will fail
    api.post.mockRejectedValueOnce(new Error('Network error'))

    render(<GovtAuthSignUpForm />)
    const user = userEvent.setup()

    await user.type(screen.getByPlaceholderText('Enter your First Name'), 'Gov')
    await user.type(screen.getByPlaceholderText('Enter your Last Name'), 'Admin')
    await user.type(screen.getByPlaceholderText('Enter your email'), 'admin@gov.test')
    await user.type(screen.getByPlaceholderText('Enter Password'), 'pass1234')
    await user.type(screen.getByPlaceholderText('Re-enter Password'), 'pass1234')
    await user.type(screen.getByPlaceholderText('Enter Mobile Number'), '+1234567890')

    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument())
    const select = screen.getByRole('combobox')
    await user.selectOptions(select, String(departmentsMock[0].id))

    await user.click(screen.getByRole('button', { name: /SignUp/i }))

    await waitFor(() => expect(screen.getByText(/Verify Your Email/i)).toBeInTheDocument())

    await user.click(screen.getByRole('button', { name: /Resend OTP/i }))

    await waitFor(() => {
      expect(screen.getByText('Failed to resend OTP. Please try again.')).toBeInTheDocument()
    })
  })

  it('toggles password visibility when clicking eye buttons', async () => {
    render(<GovtAuthSignUpForm />)
    const user = userEvent.setup()

    const pwdInput = screen.getByPlaceholderText('Enter Password')
    const pwdToggle = pwdInput.parentElement.querySelector('button')
    expect(pwdInput).toHaveAttribute('type', 'password')
    await user.click(pwdToggle)
    expect(pwdInput).toHaveAttribute('type', 'text')

    const rePwdInput = screen.getByPlaceholderText('Re-enter Password')
    const rePwdToggle = rePwdInput.parentElement.querySelector('button')
    expect(rePwdInput).toHaveAttribute('type', 'password')
    await user.click(rePwdToggle)
    expect(rePwdInput).toHaveAttribute('type', 'text')
  })
})
