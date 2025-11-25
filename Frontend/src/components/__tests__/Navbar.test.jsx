import React from 'react'
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import Navbar from '../Navbar'

const tabs = ["Citizen", "Government Authority", "Maintenance Crew", "Administrator"]

describe('Navbar component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('renders all tab buttons', () => {
    const setActiveTab = vi.fn()
    render(<Navbar activeTab={null} setActiveTab={setActiveTab} />)

    tabs.forEach((tab) => {
      expect(screen.getByRole('button', { name: tab })).toBeInTheDocument()
    })
  })

  it('applies active class to the active tab', () => {
    const setActiveTab = vi.fn()
    render(<Navbar activeTab={'Maintenance Crew'} setActiveTab={setActiveTab} />)

    const activeButton = screen.getByRole('button', { name: 'Maintenance Crew' })
    expect(activeButton).toHaveClass('nav-btn', 'active')

    // other buttons should not have active class
    expect(screen.getByRole('button', { name: 'Citizen' })).not.toHaveClass('active')
  })

  it('calls setActiveTab with correct value when a tab is clicked', async () => {
    const setActiveTab = vi.fn()
    render(<Navbar activeTab={'Citizen'} setActiveTab={setActiveTab} />)

    const user = userEvent.setup()
    const target = screen.getByRole('button', { name: 'Administrator' })
    await user.click(target)

    expect(setActiveTab).toHaveBeenCalledTimes(1)
    expect(setActiveTab).toHaveBeenCalledWith('Administrator')
  })

  it('handles multiple clicks and different tabs', async () => {
    const setActiveTab = vi.fn()
    render(<Navbar activeTab={null} setActiveTab={setActiveTab} />)

    const user = userEvent.setup()
    await user.click(screen.getByRole('button', { name: 'Government Authority' }))
    await user.click(screen.getByRole('button', { name: 'Maintenance Crew' }))

    expect(setActiveTab).toHaveBeenCalledTimes(2)
    expect(setActiveTab).toHaveBeenCalledWith('Government Authority')
    expect(setActiveTab).toHaveBeenCalledWith('Maintenance Crew')
  })

  it('renders without activeTab prop (no button active)', () => {
    const setActiveTab = vi.fn()
    render(<Navbar setActiveTab={setActiveTab} />)

    tabs.forEach(tab => {
      const btn = screen.getByRole('button', { name: tab })
      expect(btn).toBeInTheDocument()
      expect(btn).not.toHaveClass('active')
    })
  })

  it('is accessible via role and name', () => {
    const setActiveTab = vi.fn()
    render(<Navbar activeTab={'Citizen'} setActiveTab={setActiveTab} />)

    const btn = screen.getByRole('button', { name: /Citizen/i })
    expect(btn).toBeInTheDocument()
  })

  it('matches snapshot', () => {
    const setActiveTab = vi.fn()
    const { container } = render(<Navbar activeTab={'Citizen'} setActiveTab={setActiveTab} />)
    expect(container).toMatchSnapshot()
  })
})
