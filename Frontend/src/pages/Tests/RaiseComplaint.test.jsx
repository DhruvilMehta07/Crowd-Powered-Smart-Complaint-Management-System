import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import RaiseComplaint from '../pages/RaiseComplaint'

describe('RaiseComplaint page', () => {
  it('renders the page heading', () => {
    render(<RaiseComplaint />)
    const heading = screen.getByRole('heading', { name: /raise complaint/i })
    expect(heading).toBeInTheDocument()
  })

  it('shows the placeholder paragraph', () => {
    render(<RaiseComplaint />)
    expect(
      screen.getByText(/form to raise a new complaint \(placeholder\)\./i)
    ).toBeInTheDocument()
  })

  it('matches snapshot', () => {
    const { container } = render(<RaiseComplaint />)
    expect(container).toMatchSnapshot()
  })
})
