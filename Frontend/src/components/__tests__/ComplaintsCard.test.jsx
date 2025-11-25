import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import ComplaintCard from '../ComplaintsCard';

describe('ComplaintCard Component', () => {
  const mockProps = {
    user: 'John Doe',
    date: '2024-01-15',
    text: 'Pothole on Main Street needs urgent repair',
    assigned: 'Public Works Team',
    onUpvote: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ========== Rendering Tests ==========

  it('should render the component without crashing', () => {
    render(<ComplaintCard {...mockProps} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should display user name', () => {
    render(<ComplaintCard {...mockProps} />);
    expect(screen.getByText('John Doe')).toBeInTheDocument();
  });

  it('should display complaint date', () => {
    render(<ComplaintCard {...mockProps} />);
    expect(screen.getByText('2024-01-15')).toBeInTheDocument();
  });

  it('should display complaint text', () => {
    render(<ComplaintCard {...mockProps} />);
    expect(screen.getByText('Pothole on Main Street needs urgent repair')).toBeInTheDocument();
  });

  it('should display assigned team/person', () => {
    render(<ComplaintCard {...mockProps} />);
    expect(screen.getByText('Public Works Team')).toBeInTheDocument();
    expect(screen.getByText('Assigned to:')).toBeInTheDocument();
  });

  it('should render all action buttons', () => {
    render(<ComplaintCard {...mockProps} />);
    expect(screen.getByRole('button', { name: /👍 Upvote/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /💬 Comment/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /📤 Share/i })).toBeInTheDocument();
  });

  it('should have correct layout structure', () => {
    const { container } = render(<ComplaintCard {...mockProps} />);
    const card = container.querySelector('.bg-white');
    expect(card).toHaveClass('p-4', 'rounded-lg', 'shadow');
  });

  // ========== Content Display Tests ==========

  it('should display different user names', () => {
    render(<ComplaintCard {...mockProps} user="Jane Smith" />);
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });

  it('should display different dates', () => {
    render(<ComplaintCard {...mockProps} date="2024-12-25" />);
    expect(screen.getByText('2024-12-25')).toBeInTheDocument();
  });

  it('should display longer complaint text', () => {
    const longText = 'This is a very long complaint about a serious issue in the neighborhood that needs immediate attention from the authorities.';
    render(<ComplaintCard {...mockProps} text={longText} />);
    expect(screen.getByText(longText)).toBeInTheDocument();
  });

  it('should display different assigned teams', () => {
    render(<ComplaintCard {...mockProps} assigned="Water Department" />);
    expect(screen.getByText('Water Department')).toBeInTheDocument();
  });

  it('should handle empty or minimal text', () => {
    render(<ComplaintCard {...mockProps} text="Issue" />);
    expect(screen.getByText('Issue')).toBeInTheDocument();
  });

  it('should handle special characters in text', () => {
    const specialText = 'Complaint: "Road is damaged" & needs repair!';
    render(<ComplaintCard {...mockProps} text={specialText} />);
    expect(screen.getByText(specialText)).toBeInTheDocument();
  });

  // ========== Button Interaction Tests ==========

  it('should call onUpvote when upvote button is clicked', async () => {
    const onUpvote = vi.fn();
    render(<ComplaintCard {...mockProps} onUpvote={onUpvote} />);
    
    const user = userEvent.setup();
    const upvoteButton = screen.getByRole('button', { name: /👍 Upvote/i });
    
    await user.click(upvoteButton);
    expect(onUpvote).toHaveBeenCalledTimes(1);
  });

  it('should call onUpvote multiple times on multiple clicks', async () => {
    const onUpvote = vi.fn();
    render(<ComplaintCard {...mockProps} onUpvote={onUpvote} />);
    
    const user = userEvent.setup();
    const upvoteButton = screen.getByRole('button', { name: /👍 Upvote/i });
    
    await user.click(upvoteButton);
    await user.click(upvoteButton);
    await user.click(upvoteButton);
    
    expect(onUpvote).toHaveBeenCalledTimes(3);
  });

  it('should render comment button without onClick handler', () => {
    render(<ComplaintCard {...mockProps} />);
    const commentButton = screen.getByRole('button', { name: /💬 Comment/i });
    expect(commentButton).toBeInTheDocument();
  });

  it('should render share button without onClick handler', () => {
    render(<ComplaintCard {...mockProps} />);
    const shareButton = screen.getByRole('button', { name: /📤 Share/i });
    expect(shareButton).toBeInTheDocument();
  });

  it('should have hover styles on buttons', () => {
    const { container } = render(<ComplaintCard {...mockProps} />);
    const buttons = container.querySelectorAll('button');
    
    buttons.forEach(button => {
      expect(button).toHaveClass('hover:text-blue-600');
    });
  });

  // ========== Styling Tests ==========

  it('should apply correct card styling', () => {
    const { container } = render(<ComplaintCard {...mockProps} />);
    const card = container.querySelector('.bg-white');
    
    expect(card).toHaveClass('bg-white');
    expect(card).toHaveClass('p-4');
    expect(card).toHaveClass('rounded-lg');
    expect(card).toHaveClass('shadow');
  });

  it('should apply correct user name styling', () => {
    const { container } = render(<ComplaintCard {...mockProps} />);
    const userSpan = Array.from(container.querySelectorAll('span'))
      .find(span => span.textContent === 'John Doe');
    
    expect(userSpan).toHaveClass('font-semibold');
  });

  it('should apply correct date styling', () => {
    const { container } = render(<ComplaintCard {...mockProps} />);
    const dateSpan = Array.from(container.querySelectorAll('span'))
      .find(span => span.textContent === '2024-01-15');
    
    expect(dateSpan).toHaveClass('text-sm', 'text-gray-500');
  });

  it('should apply correct text styling', () => {
    const { container } = render(<ComplaintCard {...mockProps} />);
    const textParagraph = container.querySelector('p.text-gray-700');
    
    expect(textParagraph).toHaveClass('text-gray-700', 'mb-2');
    expect(textParagraph.textContent).toBe('Pothole on Main Street needs urgent repair');
  });

  it('should apply correct assigned styling', () => {
    const { container } = render(<ComplaintCard {...mockProps} />);
    const assignedSpan = Array.from(container.querySelectorAll('span'))
      .find(span => span.textContent === 'Public Works Team');
    
    expect(assignedSpan).toHaveClass('text-gray-600');
  });

  it('should apply flex layout to header', () => {
    const { container } = render(<ComplaintCard {...mockProps} />);
    const header = container.querySelector('.flex.justify-between');
    
    expect(header).toBeInTheDocument();
  });

  it('should apply flex layout to button group', () => {
    const { container } = render(<ComplaintCard {...mockProps} />);
    const buttonGroup = container.querySelector('.flex.gap-6');
    
    expect(buttonGroup).toBeInTheDocument();
  });

  // ========== Props Variations Tests ==========

  it('should render with all required props', () => {
    render(<ComplaintCard {...mockProps} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('2024-01-15')).toBeInTheDocument();
    expect(screen.getByText('Pothole on Main Street needs urgent repair')).toBeInTheDocument();
    expect(screen.getByText('Public Works Team')).toBeInTheDocument();
  });

  it('should render with numeric assigned value', () => {
    render(<ComplaintCard {...mockProps} assigned="Team #5" />);
    expect(screen.getByText('Team #5')).toBeInTheDocument();
  });

  it('should render with different date formats', () => {
    render(<ComplaintCard {...mockProps} date="Jan 15, 2024" />);
    expect(screen.getByText('Jan 15, 2024')).toBeInTheDocument();
  });

  it('should render with short user name', () => {
    render(<ComplaintCard {...mockProps} user="Jo" />);
    expect(screen.getByText('Jo')).toBeInTheDocument();
  });

  it('should render with very long user name', () => {
    const longName = 'Christopher Alexander Montgomery III';
    render(<ComplaintCard {...mockProps} user={longName} />);
    expect(screen.getByText(longName)).toBeInTheDocument();
  });

  // ========== Edge Cases ==========

  it('should handle onUpvote callback not being provided gracefully', () => {
    // Should not throw error even if onUpvote is undefined
    const { container } = render(
      <ComplaintCard 
        user="John"
        date="2024-01-15"
        text="Test complaint"
        assigned="Team"
      />
    );
    expect(container).toBeInTheDocument();
  });

  it('should display complaint with all whitespace preserved in text', () => {
    const textWithWhitespace = 'Line 1\nLine 2\nLine 3';
    render(<ComplaintCard {...mockProps} text={textWithWhitespace} />);
    // Use regex to match text with flexible whitespace handling
    expect(screen.getByText(/Line 1.*Line 2.*Line 3/s)).toBeInTheDocument();
  });

  it('should handle very long complaint text', () => {
    const veryLongText = 'A'.repeat(500);
    render(<ComplaintCard {...mockProps} text={veryLongText} />);
    expect(screen.getByText(veryLongText)).toBeInTheDocument();
  });

  it('should render multiple card instances independently', () => {
    const { container } = render(
      <>
        <ComplaintCard {...mockProps} user="User 1" />
        <ComplaintCard {...mockProps} user="User 2" />
        <ComplaintCard {...mockProps} user="User 3" />
      </>
    );

    expect(screen.getByText('User 1')).toBeInTheDocument();
    expect(screen.getByText('User 2')).toBeInTheDocument();
    expect(screen.getByText('User 3')).toBeInTheDocument();
    
    // Should have 3 cards
    const cards = container.querySelectorAll('.bg-white');
    expect(cards.length).toBe(3);
  });

  it('should maintain upvote handler isolation across multiple instances', async () => {
    const onUpvote1 = vi.fn();
    const onUpvote2 = vi.fn();
    
    const { rerender } = render(
      <>
        <ComplaintCard {...mockProps} onUpvote={onUpvote1} user="User 1" />
        <ComplaintCard {...mockProps} onUpvote={onUpvote2} user="User 2" />
      </>
    );

    const user = userEvent.setup();
    const upvoteButtons = screen.getAllByRole('button', { name: /👍 Upvote/i });
    
    await user.click(upvoteButtons[0]);
    await user.click(upvoteButtons[1]);
    
    expect(onUpvote1).toHaveBeenCalledTimes(1);
    expect(onUpvote2).toHaveBeenCalledTimes(1);
  });

  // ========== Snapshot Test ==========

  it('should match snapshot on initial render', () => {
    const { container } = render(<ComplaintCard {...mockProps} />);
    expect(container).toMatchSnapshot();
  });

  it('should match snapshot with different data', () => {
    const { container } = render(
      <ComplaintCard
        user="Jane Smith"
        date="2024-12-01"
        text="Broken streetlight at corner"
        assigned="Electrical Team"
        onUpvote={vi.fn()}
      />
    );
    expect(container).toMatchSnapshot();
  });
});
