import React from 'react'
import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import RaiseComplaint from '../RaiseComplaint'

describe('RaiseComplaint Component - 100% Coverage', () => {
  describe('Basic Rendering', () => {
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

    it('renders h1 heading', () => {
      render(<RaiseComplaint />)
      const heading = screen.getByRole('heading', { level: 1 })
      expect(heading).toBeInTheDocument()
    })

    it('has correct text content in heading', () => {
      render(<RaiseComplaint />)
      expect(screen.getByText('Raise Complaint')).toBeInTheDocument()
    })

    it('has correct text content in paragraph', () => {
      render(<RaiseComplaint />)
      expect(screen.getByText('Form to raise a new complaint (placeholder).')).toBeInTheDocument()
    })
  })

  describe('Component Structure', () => {
    it('renders without crashing', () => {
      expect(() => render(<RaiseComplaint />)).not.toThrow()
    })

    it('returns a valid React component', () => {
      expect(RaiseComplaint).toBeDefined()
      expect(typeof RaiseComplaint).toBe('function')
    })

    it('renders as a functional component', () => {
      const result = render(<RaiseComplaint />)
      expect(result).toBeDefined()
      expect(result.container).toBeDefined()
    })

    it('renders with div as root element', () => {
      const { container } = render(<RaiseComplaint />)
      const root = container.firstChild
      expect(root.tagName).toBe('DIV')
    })

    it('contains exactly one h1 and one p element', () => {
      const { container } = render(<RaiseComplaint />)
      const headings = container.querySelectorAll('h1')
      const paragraphs = container.querySelectorAll('p')
      expect(headings.length).toBe(1)
      expect(paragraphs.length).toBe(1)
    })
  })

  describe('CSS Classes and Styling', () => {
    it('has p-6 padding class on container', () => {
      const { container } = render(<RaiseComplaint />)
      const root = container.firstChild
      expect(root).toHaveClass('p-6')
    })

    it('has text-2xl class on heading', () => {
      const { container } = render(<RaiseComplaint />)
      const heading = container.querySelector('h1')
      expect(heading).toHaveClass('text-2xl')
    })

    it('has font-bold class on heading', () => {
      const { container } = render(<RaiseComplaint />)
      const heading = container.querySelector('h1')
      expect(heading).toHaveClass('font-bold')
    })

    it('has mt-4 class on paragraph', () => {
      const { container } = render(<RaiseComplaint />)
      const paragraph = container.querySelector('p')
      expect(paragraph).toHaveClass('mt-4')
    })

    it('heading has all required styling classes', () => {
      const { container } = render(<RaiseComplaint />)
      const heading = container.querySelector('h1')
      expect(heading.className).toMatch(/text-2xl/)
      expect(heading.className).toMatch(/font-bold/)
    })

    it('paragraph has mt-4 spacing', () => {
      const { container } = render(<RaiseComplaint />)
      const paragraph = container.querySelector('p')
      expect(paragraph.className).toMatch(/mt-4/)
    })
  })

  describe('DOM Structure', () => {
    it('heading is direct child of container div', () => {
      const { container } = render(<RaiseComplaint />)
      const root = container.firstChild
      const heading = root.querySelector('h1')
      expect(heading.parentElement).toBe(root)
    })

    it('paragraph is direct child of container div', () => {
      const { container } = render(<RaiseComplaint />)
      const root = container.firstChild
      const paragraph = root.querySelector('p')
      expect(paragraph.parentElement).toBe(root)
    })

    it('heading comes before paragraph in DOM order', () => {
      const { container } = render(<RaiseComplaint />)
      const heading = container.querySelector('h1')
      const paragraph = container.querySelector('p')
      const headingIndex = Array.from(container.querySelectorAll('*')).indexOf(heading)
      const paragraphIndex = Array.from(container.querySelectorAll('*')).indexOf(paragraph)
      expect(headingIndex).toBeLessThan(paragraphIndex)
    })

    it('has no extra nested divs', () => {
      const { container } = render(<RaiseComplaint />)
      const divs = container.querySelectorAll('div')
      expect(divs.length).toBeLessThanOrEqual(2) // root + render container
    })

    it('has no buttons in the component', () => {
      render(<RaiseComplaint />)
      const buttons = screen.queryAllByRole('button')
      expect(buttons.length).toBe(0)
    })

    it('has no input elements', () => {
      render(<RaiseComplaint />)
      const inputs = screen.queryAllByRole('textbox')
      expect(inputs.length).toBe(0)
    })

    it('has no links', () => {
      render(<RaiseComplaint />)
      const links = screen.queryAllByRole('link')
      expect(links.length).toBe(0)
    })
  })

  describe('Accessibility', () => {
    it('has proper heading hierarchy', () => {
      render(<RaiseComplaint />)
      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toBeInTheDocument()
    })

    it('heading is not a button', () => {
      const { container } = render(<RaiseComplaint />)
      const heading = container.querySelector('h1')
      expect(heading.tagName).toBe('H1')
    })

    it('paragraph is semantic paragraph element', () => {
      const { container } = render(<RaiseComplaint />)
      const paragraph = container.querySelector('p')
      expect(paragraph.tagName).toBe('P')
    })

    it('text content is readable', () => {
      render(<RaiseComplaint />)
      const heading = screen.getByText('Raise Complaint')
      expect(heading.textContent.length).toBeGreaterThan(0)
    })
  })

  describe('Content Verification', () => {
    it('displays complete heading text without truncation', () => {
      render(<RaiseComplaint />)
      const heading = screen.getByText('Raise Complaint')
      expect(heading.textContent).toEqual('Raise Complaint')
    })

    it('displays complete paragraph text', () => {
      render(<RaiseComplaint />)
      const paragraph = screen.getByText(/Form to raise a new complaint/)
      expect(paragraph.textContent).toContain('placeholder')
    })

    it('heading text matches exactly', () => {
      render(<RaiseComplaint />)
      expect(screen.getByText('Raise Complaint')).toBeInTheDocument()
    })

    it('paragraph text includes "(placeholder)"', () => {
      render(<RaiseComplaint />)
      expect(screen.getByText(/\(placeholder\)/)).toBeInTheDocument()
    })
  })

  describe('Rendering Consistency', () => {
    it('renders consistently across multiple renders', () => {
      const { rerender } = render(<RaiseComplaint />)
      const firstHeading = screen.getByText('Raise Complaint')
      const firstText = firstHeading.textContent

      rerender(<RaiseComplaint />)
      const secondHeading = screen.getByText('Raise Complaint')
      const secondText = secondHeading.textContent

      expect(firstText).toEqual(secondText)
    })

    it('maintains DOM structure after rerender', () => {
      const { rerender, container } = render(<RaiseComplaint />)
      const firstHtml = container.innerHTML

      rerender(<RaiseComplaint />)
      const secondHtml = container.innerHTML

      expect(firstHtml).toEqual(secondHtml)
    })

    it('can be rendered multiple times without error', () => {
      const { rerender } = render(<RaiseComplaint />)
      expect(() => {
        rerender(<RaiseComplaint />)
        rerender(<RaiseComplaint />)
      }).not.toThrow()
    })
  })

  describe('Edge Cases', () => {
    it('renders with no props passed', () => {
      render(<RaiseComplaint />)
      expect(screen.getByRole('heading')).toBeInTheDocument()
    })

    it('does not accept or use any props', () => {
      const { container: container1 } = render(<RaiseComplaint />)
      const { container: container2 } = render(<RaiseComplaint someProps="test" />)
      expect(container1.innerHTML).toBe(container2.innerHTML)
    })

    it('renders even when DOM is empty before', () => {
      const { unmount } = render(<RaiseComplaint />)
      unmount()
      render(<RaiseComplaint />)
      expect(screen.getByRole('heading')).toBeInTheDocument()
    })

    it('snapshot test matches', () => {
      const { container } = render(<RaiseComplaint />)
      expect(container).toMatchSnapshot()
    })
  })

  describe('Complete Coverage - All Branches', () => {
    it('renders all JSX elements', () => {
      const { container } = render(<RaiseComplaint />)
      const root = container.firstChild
      const h1 = root.querySelector('h1')
      const p = root.querySelector('p')
      
      expect(root).toBeTruthy()
      expect(h1).toBeTruthy()
      expect(p).toBeTruthy()
    })

    it('all elements have correct parent-child relationships', () => {
      const { container } = render(<RaiseComplaint />)
      const root = container.firstChild
      const children = root.children
      
      expect(children.length).toBe(2)
      expect(children[0].tagName).toBe('H1')
      expect(children[1].tagName).toBe('P')
    })

    it('complete DOM tree is present', () => {
      const { container } = render(<RaiseComplaint />)
      expect(container.innerHTML).toContain('<h1')
      expect(container.innerHTML).toContain('Raise Complaint')
      expect(container.innerHTML).toContain('<p')
      expect(container.innerHTML).toContain('placeholder')
    })
  })
})
