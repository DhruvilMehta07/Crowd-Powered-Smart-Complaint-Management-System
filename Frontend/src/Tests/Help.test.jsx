import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Help from '../pages/Help';

describe('Help Component', () => {
  it('should render the Help component without crashing', () => {
    render(<Help />);
    expect(screen.getByRole('heading', { level: 1 })).toBeInTheDocument();
  });

  it('should display the correct heading text', () => {
    render(<Help />);
    expect(screen.getByText('Help & Support')).toBeInTheDocument();
  });

  it('should display the question icon emoji', () => {
    render(<Help />);
    expect(screen.getByText('❓')).toBeInTheDocument();
  });

  it('should display the help question text', () => {
    render(<Help />);
    expect(screen.getByText('How can we help you?')).toBeInTheDocument();
  });

  it('should display the support description', () => {
    render(<Help />);
    expect(screen.getByText('Contact support or browse our FAQ section.')).toBeInTheDocument();
  });

  it('should render a Contact Support button', () => {
    render(<Help />);
    const button = screen.getByRole('button', { name: /contact support/i });
    expect(button).toBeInTheDocument();
  });

  it('should have the correct styling classes on the main container', () => {
    const { container } = render(<Help />);
    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('p-6', 'bg-gradient-to-br', 'min-h-screen');
  });

  it('should have the correct styling classes on the card container', () => {
    const { container } = render(<Help />);
    const card = container.querySelector('.bg-white');
    expect(card).toHaveClass('rounded-xl', 'shadow-lg', 'border-2', 'border-indigo-100');
  });

  it('should render all text content correctly', () => {
    render(<Help />);
    expect(screen.getByText('Help & Support')).toBeInTheDocument();
    expect(screen.getByText('How can we help you?')).toBeInTheDocument();
    expect(screen.getByText('Contact support or browse our FAQ section.')).toBeInTheDocument();
  });

  it('should have Contact Support button with hover styling', () => {
    render(<Help />);
    const button = screen.getByRole('button', { name: /contact support/i });
    expect(button).toHaveClass('hover:from-indigo-700', 'hover:to-blue-700', 'transition-all');
  });
});
