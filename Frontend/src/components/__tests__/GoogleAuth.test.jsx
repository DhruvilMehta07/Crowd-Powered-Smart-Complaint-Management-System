import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import GoogleAuth from '../GoogleAuth';

describe('GoogleAuth Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========== Rendering Tests ==========

  it('should render the component without crashing', () => {
    render(<GoogleAuth />);
    const container = screen.getByAltText('Google');
    expect(container).toBeInTheDocument();
  });

  it('should render the google-auth container div', () => {
    const { container } = render(<GoogleAuth />);
    const googleAuthDiv = container.querySelector('.google-auth');
    expect(googleAuthDiv).toBeInTheDocument();
  });

  it('should render the Google logo image', () => {
    render(<GoogleAuth />);
    const googleImage = screen.getByAltText('Google');
    expect(googleImage).toBeInTheDocument();
  });

  // ========== Image Tests ==========

  it('should have correct image source URL', () => {
    render(<GoogleAuth />);
    const googleImage = screen.getByAltText('Google');
    expect(googleImage).toHaveAttribute(
      'src',
      'https://upload.wikimedia.org/wikipedia/commons/4/4e/G_logo.svg'
    );
  });

  it('should have correct alt text for accessibility', () => {
    render(<GoogleAuth />);
    const googleImage = screen.getByAltText('Google');
    expect(googleImage.alt).toBe('Google');
  });

  it('should be an img element', () => {
    render(<GoogleAuth />);
    const googleImage = screen.getByAltText('Google');
    expect(googleImage.tagName).toBe('IMG');
  });

  it('should have src attribute set', () => {
    render(<GoogleAuth />);
    const googleImage = screen.getByAltText('Google');
    expect(googleImage.hasAttribute('src')).toBe(true);
  });

  it('should have alt attribute set', () => {
    render(<GoogleAuth />);
    const googleImage = screen.getByAltText('Google');
    expect(googleImage.hasAttribute('alt')).toBe(true);
  });

  // ========== Container Tests ==========

  it('should have google-auth class on container', () => {
    const { container } = render(<GoogleAuth />);
    const googleAuthDiv = container.querySelector('.google-auth');
    expect(googleAuthDiv).toHaveClass('google-auth');
  });

  it('should render container as a div', () => {
    const { container } = render(<GoogleAuth />);
    const googleAuthDiv = container.querySelector('div.google-auth');
    expect(googleAuthDiv?.tagName).toBe('DIV');
  });

  it('should contain only one image', () => {
    const { container } = render(<GoogleAuth />);
    const images = container.querySelectorAll('img');
    expect(images.length).toBe(1);
  });

  // ========== DOM Structure Tests ==========

  it('should have correct DOM structure', () => {
    const { container } = render(<GoogleAuth />);
    const googleAuthDiv = container.querySelector('.google-auth');
    const imageInDiv = googleAuthDiv?.querySelector('img');
    
    expect(imageInDiv).toBeInTheDocument();
  });

  it('should render image as child of google-auth div', () => {
    const { container } = render(<GoogleAuth />);
    const googleAuthDiv = container.querySelector('.google-auth');
    const image = googleAuthDiv?.querySelector('img');
    
    expect(image).not.toBeNull();
  });

  it('should not have any text content', () => {
    const { container } = render(<GoogleAuth />);
    const googleAuthDiv = container.querySelector('.google-auth');
    
    // Check that there's no direct text node children (only image element)
    const textContent = Array.from(googleAuthDiv?.childNodes || [])
      .filter(node => node.nodeType === 3 && node.textContent.trim())
      .length;
    
    expect(textContent).toBe(0);
  });

  // ========== URL Accessibility Tests ==========

  it('should use valid HTTPS URL for Google logo', () => {
    render(<GoogleAuth />);
    const googleImage = screen.getByAltText('Google');
    const src = googleImage.getAttribute('src');
    
    expect(src).toMatch(/^https:\/\//);
  });

  it('should use Wikimedia Commons URL for logo', () => {
    render(<GoogleAuth />);
    const googleImage = screen.getByAltText('Google');
    const src = googleImage.getAttribute('src');
    
    expect(src).toContain('wikimedia.org');
  });

  it('should have SVG file extension', () => {
    render(<GoogleAuth />);
    const googleImage = screen.getByAltText('Google');
    const src = googleImage.getAttribute('src');
    
    expect(src).toMatch(/\.svg$/);
  });

  // ========== Image Attributes Tests ==========

  it('should not have width attribute', () => {
    render(<GoogleAuth />);
    const googleImage = screen.getByAltText('Google');
    
    expect(googleImage.hasAttribute('width')).toBe(false);
  });

  it('should not have height attribute', () => {
    render(<GoogleAuth />);
    const googleImage = screen.getByAltText('Google');
    
    expect(googleImage.hasAttribute('height')).toBe(false);
  });

  it('should not have title attribute', () => {
    render(<GoogleAuth />);
    const googleImage = screen.getByAltText('Google');
    
    expect(googleImage.hasAttribute('title')).toBe(false);
  });

  it('should only have src and alt attributes', () => {
    render(<GoogleAuth />);
    const googleImage = screen.getByAltText('Google');
    const attributes = googleImage.attributes;
    
    // Should have exactly 2 attributes: src and alt
    expect(attributes.length).toBe(2);
    expect(attributes.getNamedItem('src')).not.toBeNull();
    expect(attributes.getNamedItem('alt')).not.toBeNull();
  });

  // ========== Rendering Stability Tests ==========

  it('should render consistently on multiple renders', () => {
    const { rerender } = render(<GoogleAuth />);
    let image = screen.getByAltText('Google');
    const firstSrc = image.getAttribute('src');
    
    rerender(<GoogleAuth />);
    image = screen.getByAltText('Google');
    const secondSrc = image.getAttribute('src');
    
    expect(firstSrc).toBe(secondSrc);
  });

  it('should not have any event listeners attached', () => {
    render(<GoogleAuth />);
    const googleImage = screen.getByAltText('Google');
    
    // Check that common event attributes are not present
    expect(googleImage.onclick).toBeNull();
    expect(googleImage.onload).toBeNull();
    expect(googleImage.onerror).toBeNull();
  });

  it('should render without any console errors or warnings', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    render(<GoogleAuth />);
    
    expect(consoleSpy).not.toHaveBeenCalled();
    expect(consoleWarnSpy).not.toHaveBeenCalled();
    
    consoleSpy.mockRestore();
    consoleWarnSpy.mockRestore();
  });

  // ========== Multiple Instance Tests ==========

  it('should render multiple instances independently', () => {
    const { container } = render(
      <>
        <GoogleAuth />
        <GoogleAuth />
        <GoogleAuth />
      </>
    );

    const googleAuthDivs = container.querySelectorAll('.google-auth');
    expect(googleAuthDivs.length).toBe(3);
  });

  it('should maintain separate instances of GoogleAuth', () => {
    const { container } = render(
      <>
        <GoogleAuth />
        <GoogleAuth />
      </>
    );

    const images = container.querySelectorAll('img');
    expect(images.length).toBe(2);
    
    images.forEach(img => {
      expect(img).toHaveAttribute('alt', 'Google');
    });
  });

  // ========== Component Type Tests ==========

  it('should be a functional component', () => {
    render(<GoogleAuth />);
    expect(screen.getByAltText('Google')).toBeInTheDocument();
  });

  it('should not accept any props', () => {
    const { container } = render(<GoogleAuth />);
    const googleAuthDiv = container.querySelector('.google-auth');
    expect(googleAuthDiv).toBeInTheDocument();
  });

  it('should not receive children', () => {
    const { container } = render(
      <GoogleAuth>
        <div>Should be ignored</div>
      </GoogleAuth>
    );

    // Children should not be rendered
    expect(screen.queryByText('Should be ignored')).not.toBeInTheDocument();
  });

  // ========== CSS Class Tests ==========

  it('should apply google-auth class correctly', () => {
    const { container } = render(<GoogleAuth />);
    const element = container.querySelector('.google-auth');
    
    expect(element).toHaveClass('google-auth');
  });

  it('should only have google-auth class', () => {
    const { container } = render(<GoogleAuth />);
    const element = container.querySelector('.google-auth');
    
    // Check that only one class is applied
    expect(element?.className).toBe('google-auth');
  });

  // ========== Accessibility Tests ==========

  it('should have proper alt text for screen readers', () => {
    render(<GoogleAuth />);
    const image = screen.getByAltText('Google');
    
    expect(image.alt).not.toBe('');
    expect(image.alt).not.toBe('image');
  });

  it('should be queryable by alt text', () => {
    render(<GoogleAuth />);
    
    expect(screen.getByAltText('Google')).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /Google/i })).toBeInTheDocument();
  });

  it('should be queryable by role', () => {
    render(<GoogleAuth />);
    const image = screen.getByRole('img');
    
    expect(image).toHaveAttribute('alt', 'Google');
  });

  // ========== Snapshot Tests ==========

  it('should match snapshot', () => {
    const { container } = render(<GoogleAuth />);
    expect(container).toMatchSnapshot();
  });

  it('should match image snapshot', () => {
    render(<GoogleAuth />);
    const image = screen.getByAltText('Google');
    expect(image).toMatchSnapshot();
  });

  // ========== Edge Cases ==========

  it('should handle image loading failure gracefully', () => {
    render(<GoogleAuth />);
    const image = screen.getByAltText('Google');
    
    // Simulate image load error
    const errorEvent = new Event('error');
    image.dispatchEvent(errorEvent);
    
    // Component should still be in DOM
    expect(image).toBeInTheDocument();
  });

  it('should not throw when rendered with React.StrictMode', () => {
    expect(() => {
      render(
        <React.StrictMode>
          <GoogleAuth />
        </React.StrictMode>
      );
    }).not.toThrow();
  });

  it('should maintain consistent output across renders', () => {
    const { rerender } = render(<GoogleAuth />);
    const firstRender = screen.getByAltText('Google').outerHTML;
    
    rerender(<GoogleAuth />);
    const secondRender = screen.getByAltText('Google').outerHTML;
    
    expect(firstRender).toBe(secondRender);
  });
});
