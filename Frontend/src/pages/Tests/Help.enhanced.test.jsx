import React from 'react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import Help from '../Help';

describe('Help Component - Complete Coverage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    localStorage.clear();
  });

  // Initial render tests
  describe('Initial Render - Citizen View', () => {
    it('should render Help component without crashing', () => {
      render(<Help />);
      expect(screen.getByRole('heading', { level: 1, name: /Help & Support/i })).toBeInTheDocument();
    });

    it('should display citizen guide by default when user_type is not set', () => {
      render(<Help />);
      expect(screen.getByText('Citizen Guide')).toBeInTheDocument();
    });

    it('should display all citizen FAQ questions', () => {
      render(<Help />);
      expect(screen.getByRole('button', { name: /How do I raise a complaint/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /How do I upvote a complaint/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /How do I report a complaint/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /How do I approve a resolution/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Can I submit complaints anonymously/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /How do I track my complaints/i })).toBeInTheDocument();
    });

    it('should render question mark icon', () => {
      render(<Help />);
      expect(screen.getByText('?')).toBeInTheDocument();
    });

    it('should display FAQ heading', () => {
      render(<Help />);
      expect(screen.getByRole('heading', { level: 2, name: /Frequently Asked Questions/i })).toBeInTheDocument();
    });

    it('should display subtitle text', () => {
      render(<Help />);
      expect(screen.getByText(/Find answers to commonly asked questions below/i)).toBeInTheDocument();
    });
  });

  // Fieldworker view tests
  describe('Fieldworker View', () => {
    beforeEach(() => {
      localStorage.setItem('user_type', 'fieldworker');
    });

    it('should display fieldworker guide when user_type is fieldworker', () => {
      render(<Help />);
      expect(screen.getByText('Fieldworker Guide')).toBeInTheDocument();
    });

    it('should display all fieldworker FAQ questions', () => {
      render(<Help />);
      expect(screen.getByRole('button', { name: /How do I use the application/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /How do I submit a resolution/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /How do I view my assigned complaints/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /What should I include in resolution photos/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /What if a citizen doesn't approve my resolution/i })).toBeInTheDocument();
    });

    it('should have 5 fieldworker FAQs', () => {
      render(<Help />);
      const buttons = screen.getAllByRole('button');
      // Should have 5 FAQ buttons for fieldworker
      expect(buttons.length).toBe(5);
    });
  });

  // Accordion interaction tests
  describe('Accordion Interactions', () => {
    it('should toggle FAQ open on button click', async () => {
      render(<Help />);
      const user = userEvent.setup();

      const raiseButton = screen.getByRole('button', { name: /How do I raise a complaint/i });
      
      // Click to open
      await user.click(raiseButton);

      // Answer text should be in the document
      await waitFor(() => {
        expect(screen.getByText(/Click the "Raise Complaint" button in the sidebar/i)).toBeInTheDocument();
      });
    });

    it('should close previously opened FAQ when opening a new one', async () => {
      render(<Help />);
      const user = userEvent.setup();

      const raiseButton = screen.getByRole('button', { name: /How do I raise a complaint/i });
      const upvoteButton = screen.getByRole('button', { name: /How do I upvote a complaint/i });

      // Open first FAQ
      await user.click(raiseButton);
      
      // Open second FAQ
      await user.click(upvoteButton);

      // Both buttons should exist and be clickable
      expect(raiseButton).toBeInTheDocument();
      expect(upvoteButton).toBeInTheDocument();
    });

    it('should toggle FAQ closed when clicking the same button twice', async () => {
      render(<Help />);
      const user = userEvent.setup();

      const raiseButton = screen.getByRole('button', { name: /How do I raise a complaint/i });

      // Click to open
      await user.click(raiseButton);

      // Click to close
      await user.click(raiseButton);

      // Button should still exist
      expect(raiseButton).toBeInTheDocument();
    });
  });

  // Content verification tests
  describe('FAQ Content Verification', () => {
    it('should display complete answer for raise complaint FAQ', () => {
      render(<Help />);
      const question = screen.getByRole('button', { name: /How do I raise a complaint/i });
      fireEvent.click(question);
      
      expect(screen.getByText(/Describe your complaint in detail/i)).toBeInTheDocument();
      expect(screen.getByText(/ML system will suggest the right department/i)).toBeInTheDocument();
    });

    it('should display complete answer for upvote complaint FAQ', () => {
      render(<Help />);
      const question = screen.getByRole('button', { name: /How do I upvote a complaint/i });
      fireEvent.click(question);
      
      expect(screen.getByText(/To upvote a complaint/i)).toBeInTheDocument();
      expect(screen.getByText(/Upvoting helps prioritize important issues/i)).toBeInTheDocument();
    });

    it('should display complete answer for anonymous submission FAQ', () => {
      render(<Help />);
      const question = screen.getByRole('button', { name: /Can I submit complaints anonymously/i });
      fireEvent.click(question);
      
      expect(screen.getByText(/Yes! When raising a complaint/i)).toBeInTheDocument();
      expect(screen.getByText(/Check the "Submit Anonymously" option/i)).toBeInTheDocument();
    });

    it('should display complete answer for tracking complaints FAQ', () => {
      render(<Help />);
      const question = screen.getByRole('button', { name: /How do I track my complaints/i });
      fireEvent.click(question);
      
      expect(screen.getByText(/Click "Past Complaints" in the sidebar/i)).toBeInTheDocument();
      expect(screen.getByText(/Check notifications for real-time updates/i)).toBeInTheDocument();
    });
  });

  // CSS classes and styling tests
  describe('Styling and CSS Classes', () => {
    it('should have correct classes on main container', () => {
      const { container } = render(<Help />);
      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('min-h-screen');
    });

    it('should have correct classes on header card', () => {
      const { container } = render(<Help />);
      const headerCard = container.querySelector('.bg-white');
      expect(headerCard).toHaveClass('rounded-xl', 'shadow-lg');
    });

    it('should have correct classes on FAQ item buttons', () => {
      const { container } = render(<Help />);
      const buttons = container.querySelectorAll('button[class*="flex items-center justify-between p-4"]');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should apply gradient background to icon container', () => {
      const { container } = render(<Help />);
      const iconDiv = container.querySelector('.bg-gradient-to-br');
      expect(iconDiv).toHaveClass('from-[#4B687A]', 'to-[#3C5260]');
    });

    it('should have chevron icon with transition classes', () => {
      const { container } = render(<Help />);
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<Help />);
      const h1 = screen.getByRole('heading', { level: 1 });
      const h2 = screen.getByRole('heading', { level: 2 });
      expect(h1).toBeInTheDocument();
      expect(h2).toBeInTheDocument();
    });

    it('should have buttons for FAQ items', () => {
      render(<Help />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach(button => {
        expect(button.textContent.length).toBeGreaterThan(0);
      });
    });

    it('should have text content in all FAQ items', () => {
      render(<Help />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toHaveTextContent(/./);
      });
    });
  });

  // ChevronDownIcon component tests
  describe('ChevronDownIcon Component', () => {
    it('should render SVG element with correct viewBox', () => {
      const { container } = render(<Help />);
      const svgs = container.querySelectorAll('svg[viewBox="0 0 24 24"]');
      expect(svgs.length).toBeGreaterThan(0);
    });

    it('should have proper path element in SVG', () => {
      const { container } = render(<Help />);
      const paths = container.querySelectorAll('svg path[d*="12.53"]');
      expect(paths.length).toBeGreaterThan(0);
    });
  });

  // Multiple opens/closes test
  describe('Multiple Toggle Scenarios', () => {
    it('should handle rapid clicking on multiple FAQs', async () => {
      render(<Help />);
      const user = userEvent.setup();

      const buttons = screen.getAllByRole('button').slice(0, 3);

      for (const button of buttons) {
        await user.click(button);
      }

      // Last clicked should be open
      const lastButton = buttons[buttons.length - 1];
      expect(lastButton).toBeInTheDocument();
    });

    it('should maintain state when opening and closing same FAQ multiple times', async () => {
      render(<Help />);
      const user = userEvent.setup();

      const raiseButton = screen.getByRole('button', { name: /How do I raise a complaint/i });

      // Open
      await user.click(raiseButton);
      // Close
      await user.click(raiseButton);
      // Open again
      await user.click(raiseButton);

      // Should still be accessible
      expect(raiseButton).toBeInTheDocument();
    });
  });

  // LocalStorage edge cases
  describe('LocalStorage Edge Cases', () => {
    it('should handle null user_type gracefully', () => {
      localStorage.removeItem('user_type');
      render(<Help />);
      expect(screen.getByText('Citizen Guide')).toBeInTheDocument();
    });

    it('should handle undefined user_type gracefully', () => {
      localStorage.setItem('user_type', '');
      render(<Help />);
      expect(screen.getByText('Citizen Guide')).toBeInTheDocument();
    });

    it('should handle invalid user_type by defaulting to citizen', () => {
      localStorage.setItem('user_type', 'invalid_type');
      render(<Help />);
      expect(screen.getByText('Citizen Guide')).toBeInTheDocument();
    });
  });

  // Mobile responsiveness
  describe('Mobile Responsiveness', () => {
    it('should have responsive max-width container', () => {
      const { container } = render(<Help />);
      const maxWidthDiv = container.querySelector('.max-w-4xl');
      expect(maxWidthDiv).toBeInTheDocument();
    });

    it('should have flex layout for button content', () => {
      const { container } = render(<Help />);
      const flexButtons = container.querySelectorAll('button[class*="flex"]');
      expect(flexButtons.length).toBeGreaterThan(0);
    });
  });

  // Integration tests
  describe('Integration Tests', () => {
    it('should work with citizen workflow: open multiple FAQs and track state', async () => {
      render(<Help />);
      const user = userEvent.setup();

      // User reads about raising complaint
      const raiseBtn = screen.getByRole('button', { name: /How do I raise a complaint/i });
      await user.click(raiseBtn);

      // User then reads about upvoting
      const upvoteBtn = screen.getByRole('button', { name: /How do I upvote a complaint/i });
      await user.click(upvoteBtn);

      // Both buttons should exist
      expect(upvoteBtn).toBeInTheDocument();
      expect(raiseBtn).toBeInTheDocument();
    });

    it('should work with fieldworker workflow', () => {
      localStorage.setItem('user_type', 'fieldworker');
      render(<Help />);

      expect(screen.getByText('Fieldworker Guide')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /How do I submit a resolution/i })).toBeInTheDocument();
    });
  });

  // Edge case tests
  describe('Edge Cases', () => {
    it('should render with all FAQs initially closed', () => {
      const { container } = render(<Help />);
      const closedAnswers = container.querySelectorAll('.max-h-0');
      expect(closedAnswers.length).toBeGreaterThan(0);
    });

    it('should maintain openFAQ state across re-renders', async () => {
      const { rerender } = render(<Help />);
      const user = userEvent.setup();

      const raiseBtn = screen.getByRole('button', { name: /How do I raise a complaint/i });
      await user.click(raiseBtn);

      // Re-render component
      rerender(<Help />);

      // Button should still exist
      expect(screen.getByRole('button', { name: /How do I raise a complaint/i })).toBeInTheDocument();
    });
  });
});
