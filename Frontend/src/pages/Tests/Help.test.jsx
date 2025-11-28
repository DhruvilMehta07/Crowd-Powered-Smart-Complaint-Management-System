import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Help from '../Help';

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
    expect(screen.getByText('?')).toBeInTheDocument();
  });

  it('should display citizen guide text', () => {
    render(<Help />);
    expect(screen.getByText('Citizen Guide')).toBeInTheDocument();
  });

  it('should display FAQ section', () => {
    render(<Help />);
    expect(screen.getByText('Frequently Asked Questions')).toBeInTheDocument();
  });

  it('should render FAQ accordion buttons', () => {
    render(<Help />);
    expect(screen.getByRole('button', { name: /How do I raise a complaint/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /How do I upvote a complaint/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /How do I report a complaint/i })).toBeInTheDocument();
  });

  it('should have correct styling classes on the main container', () => {
    const { container } = render(<Help />);
    const mainDiv = container.firstChild;
    expect(mainDiv).toHaveClass('min-h-screen');
  });

  it('should have the correct styling classes on the card container', () => {
    const { container } = render(<Help />);
    const card = container.querySelector('.bg-white');
    expect(card).toHaveClass('rounded-xl', 'shadow-lg');
  });

  it('should render all FAQ buttons', () => {
    render(<Help />);
    const buttons = screen.getAllByRole('button');
    // At least 6 FAQ accordion buttons should be present
    expect(buttons.length).toBeGreaterThanOrEqual(6);
  });

  it('should have accordion buttons with proper structure', () => {
    render(<Help />);
    const raiseBtn = screen.getByRole('button', { name: /How do I raise a complaint/i });
    expect(raiseBtn).toHaveClass('w-full', 'flex', 'items-center', 'justify-between', 'p-4');
  });

  it('should render main heading as h1', () => {
    render(<Help />);
    const heading = screen.getByRole('heading', { level: 1, name: /Help & Support/i });
    expect(heading).toBeInTheDocument();
  });

  it('should render FAQ heading as h2', () => {
    render(<Help />);
    const faqHeading = screen.getByRole('heading', { level: 2, name: /Frequently Asked Questions/i });
    expect(faqHeading).toBeInTheDocument();
  });
});
